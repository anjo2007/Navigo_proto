import { Route, User, CrowdReport, LeaderboardEntry, UserRole, SavedRoute } from '../types';
import { getDb, getFirebaseAuth } from './firebaseClient';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';

// Fallback Prototype Users for Instant Local Testing
const PROTOTYPE_USERS: Record<string, User> = {
  'commuter@navigo.com': {
    id: 'proto-commuter-id',
    name: 'Prototype Commuter',
    email: 'commuter@navigo.com',
    role: 'user',
    trustScore: 50,
    greenPoints: 240,
    isAmbassador: false
  },
  'scout@navigo.com': {
    id: 'proto-scout-id',
    name: 'Prototype Scout',
    email: 'scout@navigo.com',
    role: 'contributor',
    trustScore: 85,
    greenPoints: 1250,
    isAmbassador: true
  },
  'admin@navigo.com': {
    id: 'proto-admin-id',
    name: 'Navigo Controller',
    email: 'admin@navigo.com',
    role: 'admin',
    trustScore: 99,
    greenPoints: 3400,
    isAmbassador: true
  }
};

export const databaseService = {
  // --- AUTHENTICATION & PROFILES ---

  loginPrototype: async (email: string, pass: string): Promise<User | null> => {
    if (pass === 'admin' && PROTOTYPE_USERS[email]) {
      const user = PROTOTYPE_USERS[email];
      localStorage.setItem('proto_user_session', JSON.stringify(user));
      return user;
    }
    return null;
  },

  upsertProfile: async (
    id: string, 
    email: string, 
    fullName: string, 
    country: string, 
    role: UserRole, 
    isAmbassador: boolean
  ): Promise<User | null> => {
    const db = getDb();
    const profileData: User = {
      id,
      name: fullName,
      email,
      role,
      trustScore: role === 'contributor' ? 60 : 50,
      greenPoints: 100,
      isAmbassador
    };

    if (db) {
      try {
        await setDoc(doc(db, 'profiles', id), {
          id,
          name: fullName,
          email,
          country,
          role,
          isAmbassador,
          trustScore: profileData.trustScore,
          greenPoints: profileData.greenPoints,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore profile sync fallback to local storage:", e);
      }
    }

    localStorage.setItem('proto_user_session', JSON.stringify(profileData));
    return profileData;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const protoSession = localStorage.getItem('proto_user_session');
    if (protoSession) {
      try {
        return JSON.parse(protoSession);
      } catch (e) {
        // Continue
      }
    }

    const auth = getFirebaseAuth();
    const db = getDb();
    if (auth?.currentUser && db) {
      try {
        const snap = await getDoc(doc(db, 'profiles', auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          return {
            id: snap.id,
            name: data.name || auth.currentUser.displayName || 'User',
            email: data.email || auth.currentUser.email!,
            role: data.role || 'user',
            trustScore: data.trustScore || 50,
            greenPoints: data.greenPoints || 0,
            isAmbassador: !!data.isAmbassador
          };
        }
      } catch (e) {
        console.warn("Firestore get profile error:", e);
      }
    }

    return null;
  },

  logout: async () => {
    localStorage.removeItem('proto_user_session');
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {
        // Ignore
      }
    }
  },

  // --- SAVED ROUTES ---
  saveRoute: async (userId: string, route: Route): Promise<void> => {
    const key = `saved_routes_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.find((r: any) => r.id === route.id)) {
      const savedRoute: SavedRoute = { ...route, savedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify([savedRoute, ...existing]));
    }

    const db = getDb();
    if (db) {
      try {
        await setDoc(doc(db, 'users', userId, 'savedRoutes', route.id), {
          ...route,
          savedAt: Date.now()
        });
      } catch (e) {
        console.warn("Firestore save route fallback:", e);
      }
    }
  },

  getSavedRoutes: async (userId: string): Promise<SavedRoute[]> => {
    const db = getDb();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'savedRoutes'));
        if (!snap.empty) {
          return snap.docs.map(doc => doc.data() as SavedRoute);
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    const key = `saved_routes_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  deleteSavedRoute: async (userId: string, routeId: string): Promise<void> => {
    const key = `saved_routes_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter((r: any) => r.id !== routeId)));

    const db = getDb();
    if (db) {
      try {
        const docRef = doc(db, 'users', userId, 'savedRoutes', routeId);
        await setDoc(docRef, { deleted: true }, { merge: true });
      } catch (e) {
        // Ignore
      }
    }
  },

  // --- CROWDSOURCING & REPORTS ---

  submitCrowdReport: async (report: Omit<CrowdReport, 'id' | 'status' | 'timestamp'>): Promise<CrowdReport | null> => {
    const newReport: CrowdReport = {
      id: 'rep_' + Math.random().toString(36).substr(2, 9),
      userId: report.userId,
      type: report.type,
      level: report.level,
      location: report.location,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    const db = getDb();
    if (db) {
      try {
        const ref = await addDoc(collection(db, 'reports'), {
          userId: report.userId,
          type: report.type,
          level: report.level || 'OCCUPANCY',
          lat: report.location.lat,
          lng: report.location.lng,
          status: 'PENDING',
          timestamp: Date.now()
        });
        newReport.id = ref.id;
      } catch (e) {
        console.warn("Firestore submit report fallback to memory:", e);
      }
    }

    // Award +10 Green Points for crowd report
    await databaseService.awardGreenPoints(report.userId, 10);
    return newReport;
  },

  submitBusContribution: async (data: any): Promise<void> => {
    const user = await databaseService.getCurrentUser();
    if (!user) throw new Error("User authentication required");

    const db = getDb();
    if (db) {
      try {
        await addDoc(collection(db, 'busContributions'), {
          userId: user.id,
          userName: user.name,
          busNumber: data.busNumber,
          startStand: data.startStand,
          endStand: data.endStand,
          operatingHours: data.operatingHours,
          frequencyMinutes: data.frequencyMinutes,
          timestamp: Date.now(),
          status: 'PENDING'
        });
      } catch (e) {
        console.warn("Firestore bus contribution fallback:", e);
      }
    }

    // Award +50 Green Points for community bus contribution
    await databaseService.awardGreenPoints(user.id, 50);
  },

  getReports: async (): Promise<CrowdReport[]> => {
    const db = getDb();
    if (db) {
      try {
        const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(docData => {
            const d = docData.data();
            return {
              id: docData.id,
              userId: d.userId,
              type: d.type,
              level: d.level,
              location: { lat: d.lat || 0, lng: d.lng || 0 },
              timestamp: d.timestamp || Date.now(),
              status: d.status || 'PENDING'
            };
          });
        }
      } catch (e) {
        console.warn("Firestore get reports fallback:", e);
      }
    }
    return [];
  },

  validateReport: async (id: string, isValid: boolean): Promise<void> => {
    const db = getDb();
    if (db) {
      try {
        const docRef = doc(db, 'reports', id);
        await updateDoc(docRef, {
          status: isValid ? 'APPROVED' : 'REJECTED',
          validatedAt: Date.now()
        });
      } catch (e) {
        console.warn("Firestore validate report fallback:", e);
      }
    }
  },

  subscribeToReports: (callback: (reports: CrowdReport[]) => void): Unsubscribe | null => {
    const db = getDb();
    if (!db) return null;
    try {
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
      return onSnapshot(q, (snap) => {
        const reports: CrowdReport[] = snap.docs.map(docData => {
          const d = docData.data();
          return {
            id: docData.id,
            userId: d.userId,
            type: d.type,
            level: d.level,
            location: { lat: d.lat || 0, lng: d.lng || 0 },
            timestamp: d.timestamp || Date.now(),
            status: d.status || 'PENDING'
          };
        });
        callback(reports);
      });
    } catch (e) {
      console.warn("Firestore subscription error:", e);
      return null;
    }
  },

  awardGreenPoints: async (userId: string, points: number) => {
    const currentUser = await databaseService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.greenPoints += points;
      localStorage.setItem('proto_user_session', JSON.stringify(currentUser));
    }

    const db = getDb();
    if (db) {
      try {
        const userRef = doc(db, 'profiles', userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const currentPts = snap.data().greenPoints || 0;
          await updateDoc(userRef, { greenPoints: currentPts + points });
        }
      } catch (e) {
        console.warn("Firestore award points error:", e);
      }
    }
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const db = getDb();
    if (db) {
      try {
        const q = query(collection(db, 'profiles'), orderBy('greenPoints', 'desc'), limit(10));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((docData, index) => {
            const d = docData.data();
            return {
              userId: docData.id,
              userName: d.name || 'Scout Member',
              points: d.greenPoints || 0,
              rank: index + 1
            };
          });
        }
      } catch (e) {
        console.warn("Firestore leaderboard error:", e);
      }
    }

    // Default prototype leaderboard entries
    return [
      { userId: 'proto-scout-id', userName: 'Prototype Scout', points: 1250, rank: 1 },
      { userId: 'proto-admin-id', userName: 'Navigo Controller', points: 980, rank: 2 },
      { userId: 'proto-commuter-id', userName: 'Prototype Commuter', points: 240, rank: 3 }
    ];
  }
};
