import React, { useState } from 'react';
import { getStoredGeminiKey, saveGeminiKey } from '../services/geminiService';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [apiKey, setApiKey] = useState(getStoredGeminiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = apiKey.trim();
    if (!cleaned) {
      setError('Please enter a valid Gemini API key.');
      return;
    }

    if (cleaned.length < 20) {
      setError('API key appears too short. Please verify your Google AI Studio key.');
      return;
    }

    saveGeminiKey(cleaned);
    setError('');
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0F172A] w-full max-w-xl rounded-3xl border border-neon/40 shadow-[0_0_80px_rgba(0,230,118,0.15)] overflow-hidden flex flex-col relative animate-fade-in-up">
        
        {/* Top Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-neon via-azure to-purple-500"></div>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-neon/10 border border-neon/30 flex items-center justify-center text-neon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Gemini AI Key Setup</h2>
                <p className="text-xs text-ash mt-0.5">Powering Navigo's Intelligence Engine</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-ash hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instructions Box */}
          <div className="bg-obsidian/80 border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neon uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                How to get your free Gemini API Key
              </h3>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-azure hover:underline font-bold flex items-center gap-1"
              >
                <span>Open AI Studio</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>

            <ol className="text-xs text-mist space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-azure underline">Google AI Studio (aistudio.google.com)</a></li>
              <li>Sign in with your Google account</li>
              <li>Click <strong className="text-white">"Create API key"</strong> in the top corner</li>
              <li>Copy your generated key and paste it below</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-ash uppercase tracking-wider mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#090D16] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-ash/50 focus:border-neon focus:ring-1 focus:ring-neon outline-none font-mono text-sm pr-12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ash hover:text-white text-xs font-bold px-1"
                >
                  {showKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-coral text-xs font-bold flex items-center space-x-1.5 animate-shake">
                <svg className="w-4 h-4 text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </p>
            )}

            {savedSuccess && (
              <div className="bg-neon/10 border border-neon/40 text-neon p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
                <svg className="w-4 h-4 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>API Key Saved Successfully! Initializing AI Engine...</span>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 border border-white/10 text-ash hover:text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-neon text-void font-black py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-green-400 active:scale-98 shadow-[0_0_20px_rgba(0,230,118,0.3)] transition-all"
              >
                Save & Connect AI
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeminiKeyModal;
