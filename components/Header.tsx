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
        <div className="flex items-center justify-between py-2.5 px-3.5">
          <div className="flex items-center space-x-2">
            <NewLogo className="h-7 w-7" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Navi<span className="font-light text-ash">Go</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
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
                                <span className={`text-[9px] font-bold ${keyConfigured ? 'text-neon' : 'text-yellow-400'}`}>
                                  {keyConfigured ? '⚡ AI Key Active' : '🔑 Key Missing'}
                                </span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onProfileClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center"
                        >
                            <span className="mr-2.5">👤</span> Your Profile & Stats
                        </button>

                        <button 
                            onClick={() => { setIsMenuOpen(false); onGeminiKeyClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center"
                        >
                            <span className="mr-2.5">🔑</span> Gemini AI Key Setup
                        </button>

                        <div className="px-4 py-2 border-t border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs text-ash font-bold">Theme</span>
                            <ThemeToggle />
                        </div>
                        
                        {(user.role === 'contributor' || user.role === 'admin') && (
                            <button 
                                onClick={() => { setIsMenuOpen(false); onAddBusClick(); }}
                                className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center"
                            >
                                <span className="mr-2.5">🚌</span> Add Bus Route
                            </button>
                        )}

                        {user.role === 'admin' && (
                             <button 
                                onClick={() => { setIsMenuOpen(false); onAdminClick(); }}
                                className="w-full text-left px-4 py-3 text-xs font-medium text-gray-200 hover:bg-white/5 flex items-center"
                             >
                                <span className="mr-2.5">⚙️</span> Controller Dashboard
                             </button>
                        )}
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onLogoutClick(); }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-coral hover:bg-coral/10 flex items-center border-t border-white/5"
                        >
                            <span className="mr-2.5">🚪</span> Log Out
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
