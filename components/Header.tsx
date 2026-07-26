import React, { useState } from 'react';
import NewLogo from './icons/NewLogo';
import MenuIcon from './icons/MenuIcon';
import { User } from '../types';
import { hasGeminiKey } from '../services/geminiService';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    onTogglePanel: () => void;
    isPanelOpen: boolean;
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onAdminClick: () => void;
    onProfileClick: () => void;
    onAddBusClick: () => void;
    onGeminiKeyClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onTogglePanel, 
    user, 
    onLoginClick, 
    onLogoutClick,
    onAdminClick,
    onProfileClick,
    onAddBusClick,
    onGeminiKeyClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const keyConfigured = hasGeminiKey();

  return (
    <header className="absolute top-4 left-4 right-4 z-20 md:left-auto md:max-w-sm pointer-events-none">
      <div className="glass-panel rounded-2xl shadow-xl pointer-events-auto border border-white/10">
        <div className="flex items-center justify-between py-2.5 px-4 gap-6">
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <NewLogo className="h-7 w-7" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Navi<span className="font-light text-ash">Go</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
             <div className="relative">
                {user && user.id !== 'guest-traveler' ? (
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2 bg-white/5 px-2.5 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-neon to-azure flex items-center justify-center text-void text-xs font-black uppercase">
                            {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <span className="text-xs font-bold text-gray-200 max-w-[90px] truncate">
                            {user.name ? user.name.split(' ')[0] : 'User'}
                        </span>
                        {/* Points Pill */}
                        <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-neon/10 rounded-full border border-neon/20 ml-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-neon"></div>
                             <span className="text-[10px] text-neon font-mono font-bold">{user.greenPoints || 0}</span>
                        </div>
                    </button>
                ) : (
                    <button 
                        onClick={onLoginClick}
                        className="text-xs font-bold text-neon hover:text-green-300 px-3 py-1.5 bg-neon/10 rounded-full border border-neon/20 transition-colors"
                    >
                        Login
                    </button>
                )}

                {isMenuOpen && user && user.id !== 'guest-traveler' && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-[#121824] rounded-2xl shadow-2xl border border-white/15 overflow-hidden animate-fade-in origin-top-right z-50">
                        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                            <p className="text-[10px] text-ash uppercase font-bold tracking-wider">Profile Session</p>
                            <p className="text-xs font-bold text-white truncate mt-0.5">{user.name}</p>
                            <p className="text-[10px] text-ash font-mono truncate">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1.5">
                                <span className="px-2 py-0.5 bg-white/10 text-ash text-[9px] uppercase font-bold rounded">
                                    {user.role}
                                </span>
                                <span className={`text-[9px] font-bold flex items-center gap-1 ${keyConfigured ? 'text-neon' : 'text-yellow-400'}`}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  {keyConfigured ? 'AI Key Active' : 'Key Missing'}
                                </span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onProfileClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center gap-2.5"
                        >
                            <svg className="w-4 h-4 text-ash/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Your Profile & Stats
                        </button>

                        <button 
                            onClick={() => { setIsMenuOpen(false); onGeminiKeyClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center gap-2.5"
                        >
                            <svg className="w-4 h-4 text-ash/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                            Gemini AI Key Setup
                        </button>

                        <div className="px-4 py-2 border-t border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs text-ash font-bold">Theme</span>
                            <ThemeToggle />
                        </div>
                        
                        {(user.role === 'contributor' || user.role === 'admin') && (
                            <button 
                                onClick={() => { setIsMenuOpen(false); onAddBusClick(); }}
                                className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center gap-2.5"
                            >
                                <svg className="w-4 h-4 text-ash/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M15 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                                Add Bus Route
                            </button>
                        )}

                        {user.role === 'admin' && (
                             <button 
                                onClick={() => { setIsMenuOpen(false); onAdminClick(); }}
                                className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center gap-2.5"
                             >
                                <svg className="w-4 h-4 text-ash/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                Controller Dashboard
                             </button>
                        )}
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onLogoutClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-coral hover:bg-coral/10 flex items-center gap-2.5 border-t border-white/5"
                        >
                            <svg className="w-4 h-4 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Log Out
                        </button>
                    </div>
                )}
             </div>

             <button
                onClick={onTogglePanel}
                className="p-2 rounded-full text-ash hover:bg-white/10 md:hidden"
             >
                 <MenuIcon className="h-5 w-5" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
