
import { Route, User, CrowdReport, LeaderboardEntry, TransportMode, UserRole, SavedRoute } from '../types';
import { getSupabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// Prototype In-Built Users
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
    }
};

export const databaseService = {
    // --- AUTHENTICATION ---

    loginPrototype: async (email: string, pass: string): Promise<User | null> => {
        if (pass === 'admin' && PROTOTYPE_USERS[email]) {
            const user = PROTOTYPE_USERS[email];
            // Store locally for session persistence in prototype
            localStorage.setItem('proto_user_session', JSON.stringify(user));
            return user;
        }
        return null;
    },

    upsertProfile: async (id: string, email: string, fullName: string, country: string, role: UserRole, isAmbassador: boolean): Promise<User | null> => {
        const sb = getSupabase();
        if (!sb) return null;

        const profileData = {
            id,
            email,
            full_name: fullName,
            country,
            role,
            is_ambassador: isAmbassador,
            trust_score: role === 'contributor' ? 60 : 50,
            green_points: 100 // Starting bonus for prototype
        };

        const { error } = await sb.from('profiles').upsert(profileData);

        if (error) {
            console.error("Profile sync failed", error);
            return {
                id,
                name: fullName,
                email,
                role,
                trustScore: profileData.trust_score,
                greenPoints: profileData.green_points,
                isAmbassador
            };
        }

        return databaseService.getCurrentUser();
    },

    getCurrentUser: async (): Promise<User | null> => {
        // Check prototype session first
        const protoSession = localStorage.getItem('proto_user_session');
        if (protoSession) return JSON.parse(protoSession);

        const sb = getSupabase();
        if (!sb) return null;

        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user) return null;

        const { data: profile, error } = await sb
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            return {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email!,
                role: 'user',
                trustScore: 50,
                greenPoints: 0,
                isAmbassador: false
            };
        }

        return {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            role: profile.role as UserRole,
            trustScore: profile.trust_score,
            greenPoints: profile.green_points,
            isAmbassador: profile.is_ambassador
        };
    },

    logout: async () => {
        localStorage.removeItem('proto_user_session');
        const sb = getSupabase();
        if (sb) await sb.auth.signOut();
    },

    // --- SAVED ROUTES ---
    saveRoute: async (userId: string, route: Route): Promise<void> => {
        const key = `saved_routes_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.find((r: any) => r.id === route.id)) {
            const savedRoute: SavedRoute = { ...route, savedAt: Date.now() };
            localStorage.setItem(key, JSON.stringify([savedRoute, ...existing]));
        }
    },

    getSavedRoutes: async (userId: string): Promise<SavedRoute[]> => {
        const key = `saved_routes_${userId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    deleteSavedRoute: async (userId: string, routeId: string): Promise<void> => {
        const key = `saved_routes_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(existing.filter((r: any) => r.id !== routeId)));
    },

    // --- CROWDSOURCING ---

    submitCrowdReport: async (report: Omit<CrowdReport, 'id' | 'status' | 'timestamp'>): Promise<CrowdReport | null> => {
        const sb = getSupabase();
        if (!sb) return null;

        const { data, error } = await sb.from('reports').insert({
            user_id: report.userId,
            type: report.type,
            level: report.level,
            lat: report.location.lat,
            lng: report.location.lng,
            status: 'PENDING'
        }).select().single();

        if (error) throw new Error(error.message);

        await databaseService.awardGreenPoints(report.userId, 10);

        return {
            id: data.id,
            userId: data.user_id,
            type: data.type,
            level: data.level,
            location: { lat: data.lat, lng: data.lng },
            timestamp: new Date(data.created_at).getTime(),
            status: data.status
        };
    },
    
    submitBusContribution: async (data: any): Promise<void> => {
        const sb = getSupabase();
        if (!sb) throw new Error("Database not connected");
        const user = await databaseService.getCurrentUser();
        if (!user) throw new Error("User not authenticated");

        await sb.from('reports').insert({
            user_id: user.id,
            type: 'NEW_ROUTE', 
            level: `Bus ${data.busNumber}: ${data.startStand} to ${data.endStand}`,
            lat: 0,
            lng: 0,
            status: 'PENDING'
        });
        
        await databaseService.awardGreenPoints(user.id, 50);
    },

    getReports: async (): Promise<CrowdReport[]> => {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) return [];
        return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            level: row.level,
            location: { lat: row.lat, lng: row.lng },
            timestamp: new Date(row.created_at).getTime(),
            status: row.status
        }));
    },

    validateReport: async (id: string, isValid: boolean): Promise<void> => {
        const sb = getSupabase();
        if (!sb) return;

        const { error } = await sb.from('reports').update({
            status: isValid ? 'APPROVED' : 'REJECTED'
        }).eq('id', id);

        if (error) throw new Error(error.message);
    },

    subscribeToReports: (callback: (payload: any) => void): RealtimeChannel | null => {
        const sb = getSupabase();
        if (!sb) return null;
        return sb.channel('public:reports')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, callback)
            .subscribe();
    },

    awardGreenPoints: async (userId: string, points: number) => {
        const sb = getSupabase();
        if (!sb) return;
        const { data: profile } = await sb.from('profiles').select('green_points').eq('id', userId).single();
        if (profile) {
            await sb.from('profiles').update({ green_points: profile.green_points + points }).eq('id', userId);
        }
    },

    getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('profiles').select('id, full_name, green_points').order('green_points', { ascending: false }).limit(10);
        if (error) return [];
        return data.map((row: any, index: number) => ({
            userId: row.id,
            userName: row.full_name || 'Anonymous',
            points: row.green_points,
            rank: index + 1
        }));
    }
};
