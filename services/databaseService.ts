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

export const GUEST_USER: User = {
  id: 'guest-traveler',
  name: 'Guest Traveler',
  email: '',
  role: 'user',
  trustScore: 0,
  greenPoints: 0,
  isAmbassador: false
};

export const databaseService = {
  // --- AUTHENTICATION & PROFILES ---

  upsertProfile: async (
    id: string, 
    email: string, 
    fullName: string, 
    country: string, 
    role: UserRole, 
    isAmbassador: boolean
  ): Promise<User | null> => {
    const db = getDb();

    // Check if profile already exists in Firestore to preserve existing points/score
    let existingPoints = 0;
    let existingScore = 50;
    if (db) {
      try {
        const existingSnap: any = await Promise.race([
          getDoc(doc(db, 'profiles', id)),
          new Promise(res => setTimeout(() => res(null), 2500))
        ]);
        if (existingSnap && existingSnap.exists && existingSnap.exists()) {
          const d = existingSnap.data();
          existingPoints = d.greenPoints || 0;
          existingScore = d.trustScore || 50;
        }
      } catch (e) {
        // Continue with defaults
      }
    }

    const profileData: User = {
      id,
      name: fullName,
      email,
      role,
      trustScore: existingScore,
      greenPoints: existingPoints,
      isAmbassador
    };

    if (db) {
      const syncPromise = setDoc(doc(db, 'profiles', id), {
        id,
        name: fullName,
        email,
        country,
        role,
        isAmbassador,
        trustScore: profileData.trustScore,
        greenPoints: profileData.greenPoints,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true }).catch(e => console.warn("Firestore profile sync fallback:", e));

      await Promise.race([
        syncPromise,
        new Promise(res => setTimeout(res, 2500))
      ]);
    }

    localStorage.setItem('proto_user_session', JSON.stringify(profileData));
    return profileData;
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Check local session cache first for instant load
    const cachedSession = localStorage.getItem('proto_user_session');
    if (cachedSession) {
      try {
        const cached = JSON.parse(cachedSession);
        if (cached.id && cached.id !== 'guest-traveler') {
          return cached;
        }
      } catch (e) {
        // Continue
      }
    }

    const auth = getFirebaseAuth();
    const db = getDb();
    if (auth?.currentUser) {
      if (db) {
        try {
          const fetchPromise = getDoc(doc(db, 'profiles', auth.currentUser.uid));
          const snap: any = await Promise.race([
            fetchPromise,
            new Promise(res => setTimeout(() => res(null), 2500))
          ]);

          if (snap && snap.exists && snap.exists()) {
            const data = snap.data();
            const userObj: User = {
              id: snap.id,
              name: data.name || auth.currentUser.displayName || 'User',
              email: data.email || auth.currentUser.email!,
              role: data.role || 'user',
              trustScore: data.trustScore || 50,
              greenPoints: data.greenPoints || 0,
              isAmbassador: !!data.isAmbassador
            };
            localStorage.setItem('proto_user_session', JSON.stringify(userObj));
            return userObj;
          }
        } catch (e) {
          console.warn("Firestore get profile error:", e);
        }
      }

      // Auth user exists but no Firestore doc yet — create profile from auth data
      const newUser: User = {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
        email: auth.currentUser.email || '',
        role: 'user',
        trustScore: 50,
        greenPoints: 0,
        isAmbassador: false
      };
      localStorage.setItem('proto_user_session', JSON.stringify(newUser));
      return newUser;
    }

    return GUEST_USER;
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
    // Update local cache
    const currentUser = await databaseService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.greenPoints += points;
      localStorage.setItem('proto_user_session', JSON.stringify(currentUser));
    }

    // Persist to Firestore
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
              userName: d.name || 'NaviGo Member',
              points: d.greenPoints || 0,
              rank: index + 1
            };
          });
        }
      } catch (e) {
        console.warn("Firestore leaderboard error:", e);
      }
    }

    // Return current user only if no Firestore data available
    const currentUser = await databaseService.getCurrentUser();
    if (currentUser && currentUser.id !== 'guest-traveler') {
      return [{ userId: currentUser.id, userName: currentUser.name, points: currentUser.greenPoints, rank: 1 }];
    }
    return [];
  },

  // --- ACHIEVEMENT TRACKING ---
  getUserStats: async (userId: string): Promise<{ busReports: number; routesSaved: number; totalReports: number }> => {
    const db = getDb();
    let busReports = 0;
    let totalReports = 0;

    if (db) {
      try {
        const reportsQ = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(100));
        const reportsSnap = await getDocs(reportsQ);
        reportsSnap.docs.forEach(d => {
          if (d.data().userId === userId) {
            totalReports++;
            if (d.data().type === 'BUS' || d.data().type === 'OCCUPANCY') busReports++;
          }
        });
      } catch (e) {
        // Fallback
      }

      try {
        const contribSnap = await getDocs(collection(db, 'busContributions'));
        contribSnap.docs.forEach(d => {
          if (d.data().userId === userId) busReports++;
        });
      } catch (e) {
        // Fallback
      }
    }

    const savedRoutes = await databaseService.getSavedRoutes(userId);
    return { busReports, routesSaved: savedRoutes.length, totalReports };
  }
};

