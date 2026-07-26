import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { getFirebaseAuth } from '../services/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { databaseService } from '../services/databaseService';
import { useToast } from '../context/ToastContext';

interface LoginModalProps {
    onLoginSuccess: (user: User) => void;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [country, setCountry] = useState('India');
    const [role, setRole] = useState<UserRole>('user');
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const { showToast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // 1. Always check prototype/demo accounts first (works offline)
        const protoUser = await databaseService.loginPrototype(email, password);
        if (protoUser) {
            showToast(`Welcome back, ${protoUser.name}!`, 'success');
            onLoginSuccess(protoUser);
            setLoading(false);
            return;
        }

        // 2. Try Firebase Auth
        const auth = getFirebaseAuth();
        if (!auth) {
            // Firebase not configured — fall back to local-only account
            if (mode === 'signup') {
                const localUser = await databaseService.upsertProfile(
                    'local-' + Date.now(),
                    email,
                    fullName || email.split('@')[0],
                    country,
                    role,
                    isAmbassador
                );
                if (localUser) {
                    showToast(`Account created locally: ${localUser.name}`, 'success');
                    onLoginSuccess(localUser);
                }
            } else {
                // Sign-in without Firebase — check if there's a stored local session with this email
                const stored = localStorage.getItem('proto_user_session');
                if (stored) {
                    try {
                        const u = JSON.parse(stored);
                        if (u.email === email) {
                            showToast(`Welcome back, ${u.name}!`, 'success');
                            onLoginSuccess(u);
                            setLoading(false);
                            return;
                        }
                    } catch {}
                }
                setErrorMsg('No account found. Try signing up or use a demo account below.');
            }
            setLoading(false);
            return;
        }

        // 3. Firebase Auth is available
        try {
            if (mode === 'signup') {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (cred.user) {
                    await updateProfile(cred.user, { displayName: fullName || email.split('@')[0] });
                    const user = await databaseService.upsertProfile(
                        cred.user.uid,
                        email,
                        fullName || email.split('@')[0],
                        country,
                        role,
                        isAmbassador
                    );
                    if (user) {
                        showToast(`Account created: Welcome, ${user.name}!`, 'success');
                        onLoginSuccess(user);
                    }
                }
            } else {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                if (cred.user) {
                    const user = await databaseService.getCurrentUser();
                    if (user) {
                        showToast(`Welcome back, ${user.name}!`, 'success');
                        onLoginSuccess(user);
                    }
                }
            }
        } catch (err: any) {
            const code = err?.code || '';
            let msg = 'Authentication failed. Please try again.';
            if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
                msg = 'No account found with these credentials. Try signing up.';
            } else if (code === 'auth/wrong-password') {
                msg = 'Incorrect password. Please try again.';
            } else if (code === 'auth/email-already-in-use') {
                msg = 'Email already registered. Try signing in instead.';
            } else if (code === 'auth/weak-password') {
                msg = 'Password too weak. Use at least 6 characters.';
            } else if (code === 'auth/invalid-email') {
                msg = 'Invalid email format.';
            } else if (err?.message) {
                msg = err.message;
            }
            setErrorMsg(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = async (demoEmail: string, label: string) => {
        setLoading(true);
        setErrorMsg(null);
        const u = await databaseService.loginPrototype(demoEmail, 'admin');
        if (u) {
            showToast(`Logged in as ${label}`, 'success');
            onLoginSuccess(u);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4" onClick={onClose}>
            <div className="glass-panel rounded-[2rem] p-8 w-full max-w-md transform transition-all scale-100 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                {/* Visual Accent */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-azure/20 blur-[80px] rounded-full"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                        </h2>
                        <p className="text-ash text-[10px] mt-1 uppercase tracking-widest font-bold opacity-60">NaviGo Identity Service</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-ash hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Quick Demo Accounts — prominent at top */}
                <div className="relative z-10 mb-6">
                    <p className="text-[10px] text-ash uppercase font-bold tracking-wider mb-2">⚡ Quick Demo Access</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => quickLogin('commuter@navigo.com', 'Demo Commuter')}
                            className="px-2 py-2.5 bg-white/5 hover:bg-neon/10 border border-white/10 hover:border-neon/30 rounded-xl text-[10px] text-mist font-bold transition-all disabled:opacity-40"
                        >
                            🚶 Commuter
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => quickLogin('scout@navigo.com', 'Demo Scout')}
                            className="px-2 py-2.5 bg-white/5 hover:bg-neon/10 border border-white/10 hover:border-neon/30 rounded-xl text-[10px] text-neon font-bold transition-all disabled:opacity-40"
                        >
                            ★ Scout
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => quickLogin('admin@navigo.com', 'Controller Admin')}
                            className="px-2 py-2.5 bg-white/5 hover:bg-azure/10 border border-white/10 hover:border-azure/30 rounded-xl text-[10px] text-azure font-bold transition-all disabled:opacity-40"
                        >
                            ⚙️ Admin
                        </button>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-[10px] text-ash uppercase font-bold tracking-wider">or use email</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                    {mode === 'signup' && (
                        <div className="animate-fade-in-up">
                            <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon focus:ring-1 focus:ring-neon/50 outline-none transition-all placeholder:text-gray-600"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-azure focus:ring-1 focus:ring-azure/50 outline-none transition-all placeholder:text-gray-600"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-azure focus:ring-1 focus:ring-azure/50 outline-none transition-all placeholder:text-gray-600 font-mono"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                            minLength={4}
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-coral/10 border border-coral/30 rounded-xl px-4 py-3 text-xs text-coral font-medium animate-fade-in">
                            {errorMsg}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full relative group overflow-hidden py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 
                        ${loading ? 'bg-gray-800' : 'bg-neon hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] text-void'}`}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex justify-center items-center">
                            {loading ? (
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-white font-bold tracking-widest uppercase text-xs">Authenticating...</span>
                                </div>
                            ) : (
                                <span className="font-bold tracking-widest uppercase text-sm">
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                </span>
                            )}
                        </div>
                    </button>
                    
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(null); }}
                            className="text-xs text-ash hover:text-azure transition-colors group"
                        >
                            <span className="opacity-60">{mode === 'signin' ? "Don't have an account?" : "Already have an account?"}</span>
                            <span className="ml-1.5 font-bold group-hover:underline">
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
