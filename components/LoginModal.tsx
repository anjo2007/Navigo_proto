
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { getSupabase } from '../services/supabaseClient';
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
    
    const { showToast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Prototype Check
        const protoUser = await databaseService.loginPrototype(email, password);
        if (protoUser) {
            showToast(`Prototype Access Granted: ${protoUser.name}`, 'success');
            onLoginSuccess(protoUser);
            setLoading(false);
            return;
        }

        const sb = getSupabase();
        if (!sb) {
            showToast("System offline: API configuration missing.", 'error');
            setLoading(false);
            return;
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await sb.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { 
                            full_name: fullName, 
                            country, 
                            role, 
                            is_ambassador: isAmbassador 
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    const user = await databaseService.upsertProfile(
                        data.user.id,
                        email,
                        fullName,
                        country,
                        role,
                        isAmbassador
                    );
                    
                    if (user) {
                        showToast(`Account Provisioned: Welcome, ${fullName}`, 'success');
                        if (data.session) {
                            onLoginSuccess(user);
                        } else {
                            showToast("Registration successful! Identity linked.", 'info');
                        }
                    }
                }
            } else {
                const { data, error } = await sb.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    if (error.message.includes('Email not confirmed')) {
                        showToast("Access Denied: Identity unverified. Check dashboard.", 'error');
                    } else {
                        throw error;
                    }
                    setLoading(false);
                    return;
                }

                if (data.user && data.session) {
                     const user = await databaseService.getCurrentUser();
                     if (user) {
                         showToast(`Identity Verified: Access Granted`, 'success');
                         onLoginSuccess(user);
                     }
                }
            }
        } catch (err: any) {
            showToast(err.message || "Security protocols failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4">
            <div className="glass-panel rounded-[2rem] p-8 w-full max-w-md transform transition-all scale-100 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-azure/20 blur-[80px] rounded-full"></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {mode === 'signin' ? 'Mobility Login' : 'Register Scout'}
                        </h2>
                        <p className="text-ash text-xs mt-1 uppercase tracking-widest font-bold opacity-60">System Identity Service</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-ash hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-6 relative z-10">
                    {mode === 'signup' && (
                        <div className="animate-fade-in-up">
                            <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Legal Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-neon focus:ring-1 focus:ring-neon/50 outline-none transition-all placeholder:text-gray-600"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                    )}

                    <div className="animate-fade-in-up [animation-delay:0.1s]">
                        <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-azure focus:ring-1 focus:ring-azure/50 outline-none transition-all placeholder:text-gray-600"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="commuter@navigo.com"
                            required
                        />
                    </div>

                    <div className="animate-fade-in-up [animation-delay:0.2s]">
                        <label className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1.5 ml-1">Passcode</label>
                        <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-azure focus:ring-1 focus:ring-azure/50 outline-none transition-all placeholder:text-gray-600 font-mono"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="admin"
                            required
                            minLength={4}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full relative group overflow-hidden py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4 
                        ${loading ? 'bg-gray-800' : 'bg-neon hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] text-void'}`}
                    >
                        {/* Glow Layer */}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative z-10 flex justify-center items-center">
                            {loading ? (
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-white font-bold tracking-widest uppercase text-xs">Processing...</span>
                                </div>
                            ) : (
                                <span className="font-bold tracking-widest uppercase text-sm">
                                    {mode === 'signin' ? 'Access System' : 'Create Identity'}
                                </span>
                            )}
                        </div>
                    </button>
                    
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="text-xs text-ash hover:text-azure transition-colors flex items-center justify-center w-full group"
                        >
                            <span className="opacity-60">{mode === 'signin' ? "New to NaviGo?" : "Existing user?"}</span>
                            <span className="ml-1.5 font-bold group-hover:underline">
                                {mode === 'signin' ? 'Establish Node' : 'Return to Login'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
