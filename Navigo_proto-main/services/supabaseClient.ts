
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded credentials as per user request for immediate stability
const DEFAULT_URL = 'https://ynqcwekjrrxuoxgmjyqv.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWN3ZWtqcnJ4dW94Z21qeXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODEzMzIsImV4cCI6MjA4NTE1NzMzMn0.dfuQsQNQ3QfXyfZahjv_WQvc5eWfnuj3Wnc17qfsEAM';

let supabase: SupabaseClient | null = null;

export const saveSupabaseConfig = (url: string, key: string) => {
    try {
        localStorage.setItem('navi_sb_url', url);
        localStorage.setItem('navi_sb_key', key);
        supabase = null; // Reset client
    } catch (e) {
        console.error("Failed to save supabase config", e);
    }
};

export const getSupabase = (): SupabaseClient | null => {
    if (supabase) return supabase;

    let url = DEFAULT_URL;
    let key = DEFAULT_KEY;

    try {
        const storedUrl = localStorage.getItem('navi_sb_url');
        const storedKey = localStorage.getItem('navi_sb_key');
        if (storedUrl && storedKey) {
            url = storedUrl;
            key = storedKey;
        }
    } catch (e) {
        // Ignore local storage access errors
    }

    try {
        supabase = createClient(url, key);
        return supabase;
    } catch (e) {
        console.error("Failed to init Supabase", e);
        return null;
    }
};

export const isSupabaseConfigured = (): boolean => {
    return true; 
};
