
import React, { useState } from 'react';
import { saveSupabaseConfig } from '../services/supabaseClient';

interface SetupModalProps {
    onComplete: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onComplete }) => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.startsWith('https://')) {
            setError("Invalid Supabase URL");
            return;
        }
        if (key.length < 20) {
            setError("Invalid Anon Key");
            return;
        }

        try {
            saveSupabaseConfig(url, key);
            onComplete();
        } catch (e) {
            setError("Failed to initialize client.");
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-lg border border-neon/50 shadow-[0_0_50px_rgba(0,230,118,0.1)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Initialize System</h1>
                    <p className="text-ash text-sm">Connect to the NaviGo Mobility Cloud (Supabase)</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-neon uppercase tracking-wider mb-2">Project URL</label>
                        <input 
                            type="text" 
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://your-project.supabase.co"
                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none font-mono text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neon uppercase tracking-wider mb-2">Anon Public Key</label>
                        <input 
                            type="password" 
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            placeholder="eyJh..."
                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none font-mono text-sm"
                            required
                        />
                    </div>

                    {error && <p className="text-coral text-xs text-center">{error}</p>}

                    <div className="bg-white/5 p-4 rounded-lg text-xs text-ash leading-relaxed">
                        <strong className="text-white block mb-1">Development Mode:</strong>
                        Please create a Supabase project and paste your API credentials here to enable Real-time Reporting, Authentication, and Leaderboards.
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-neon text-void font-bold py-4 rounded-xl hover:bg-green-400 transition-colors shadow-lg"
                    >
                        Connect System
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupModal;
