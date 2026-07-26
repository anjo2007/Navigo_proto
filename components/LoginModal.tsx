import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { getFirebaseAuth } from '../services/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { databaseService } from '../services/databaseService';
import { useToast } from '../context/ToastContext';

// --- Professional SVG Icon Components ---
const IconGoogle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
);
const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9"/></svg>
);
const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M22 7l-10 6L2 7"/></svg>
);
const IconLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
);
const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);
const IconShield = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/></svg>
);
const IconAlertTriangle = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);



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
    const [showPassword, setShowPassword] = useState(false);
    
    const { showToast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // Try Firebase Auth
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
                setErrorMsg('No account found. Please create an account first.');
            }
            setLoading(false);
            return;
        }

        // Firebase Auth is available
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
            } else if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
                msg = 'Firebase is not configured. Use a demo account or set up Firebase.';
            } else if (err?.message) {
                msg = err.message;
            }
            setErrorMsg(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setErrorMsg(null);
        const auth = getFirebaseAuth();
        if (!auth) {
            setErrorMsg('Firebase is not configured.');
            setLoading(false);
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                const user = await databaseService.upsertProfile(
                    result.user.uid,
                    result.user.email || '',
                    result.user.displayName || result.user.email?.split('@')[0] || 'User',
                    'India',
                    'user',
                    false
                );
                if (user) {
                    showToast(`Welcome back, ${user.name}!`, 'success');
                    onLoginSuccess(user);
                }
            }
        } catch (err: any) {
            const code = err?.code || '';
            let msg = 'Google Sign-In failed.';
            if (code === 'auth/popup-closed-by-user') {
                msg = 'Google Sign-In window was closed before completing.';
            } else if (code === 'auth/operation-not-allowed') {
                msg = 'Google provider is not enabled in Firebase Console. Go to Authentication > Sign-in method > Add new provider > Google to enable it.';
            } else if (err?.message) {
                msg = err.message;
            }
            setErrorMsg(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fade-in px-4" onClick={onClose}>
            <div
                className="glass-panel rounded-[2rem] w-full max-w-[420px] transform transition-all scale-100 shadow-[0_8px_64px_rgba(0,0,0,0.6)] border border-white/[0.08] overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={e => e.stopPropagation()}
            >
                {/* Top gradient accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-neon via-azure to-neon/60"></div>

                {/* Background glow accents */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-azure/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-neon/8 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-neon/80">
                                <IconShield />
                            </div>
                            <div>
                                <h2 className="text-[22px] font-bold text-white tracking-tight leading-tight">
                                    {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <p className="text-ash/60 text-[10px] mt-1 uppercase tracking-[0.2em] font-semibold">NaviGo Identity</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-ash/60 hover:text-white hover:rotate-90"
                        >
                            <IconClose />
                        </button>
                    </div>

                    {/* Google Auth Button */}
                    <div className="relative z-10 mb-5">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleGoogleAuth}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 rounded-xl text-white text-xs font-bold transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-40"
                        >
                            <IconGoogle />
                            <span>Continue with Google</span>
                        </button>
                    </div>


                    {/* Divider */}
                    <div className="relative z-10 flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <span className="text-[10px] text-ash/50 uppercase font-semibold tracking-[0.15em]">or continue with email</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    
                    {/* Auth Form */}
                    <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                        {mode === 'signup' && (
                            <div className="animate-fade-in-up">
                                <label className="block text-[10px] font-semibold text-ash/60 uppercase tracking-[0.15em] mb-1.5 ml-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash/40"><IconUser /></div>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-neon/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-neon/20 outline-none transition-all duration-200 placeholder:text-white/20"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-semibold text-ash/60 uppercase tracking-[0.15em] mb-1.5 ml-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash/40"><IconMail /></div>
                                <input 
                                    type="email" 
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-azure/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-azure/20 outline-none transition-all duration-200 placeholder:text-white/20"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold text-ash/60 uppercase tracking-[0.15em] mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash/40"><IconLock /></div>
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-11 py-3 text-white text-sm focus:border-azure/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-azure/20 outline-none transition-all duration-200 placeholder:text-white/20"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ash/40 hover:text-white/70 transition-colors p-0.5"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {errorMsg && (
                            <div className="flex items-start gap-2.5 bg-coral/[0.08] border border-coral/20 rounded-xl px-4 py-3 animate-fade-in">
                                <span className="text-coral mt-0.5 flex-shrink-0"><IconAlertTriangle /></span>
                                <span className="text-[12px] text-coral/90 font-medium leading-relaxed">{errorMsg}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full relative group overflow-hidden py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.015] active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none
                            ${loading ? 'bg-white/[0.08]' : 'bg-gradient-to-r from-neon to-emerald-400 hover:shadow-[0_0_32px_rgba(0,230,118,0.3)] text-void'}`}
                        >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                            <div className="relative z-10 flex justify-center items-center gap-2">
                                {loading ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span className="text-white font-semibold tracking-wider uppercase text-xs">Authenticating…</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold tracking-wider uppercase text-[13px]">
                                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                        </span>
                                        <IconArrowRight />
                                    </>
                                )}
                            </div>
                        </button>
                        
                        {/* Mode toggle */}
                        <div className="text-center pt-2 pb-1">
                            <button
                                type="button"
                                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(null); }}
                                className="text-xs text-ash/60 hover:text-azure transition-colors duration-200 group"
                            >
                                <span>{mode === 'signin' ? "Don't have an account?" : "Already have an account?"}</span>
                                <span className="ml-1.5 font-bold text-azure/80 group-hover:text-azure group-hover:underline underline-offset-2">
                                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
