import React, { useState } from 'react';
import NewLogo from './icons/NewLogo';
import MenuIcon from './icons/MenuIcon';
import { User } from '../types';
import { hasGeminiKey } from '../services/geminiService';

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
    <header className="absolute top-4 left-4 right-4 z-20 md:left-auto md:max-w-xl pointer-events-none">
      <div className="glass-panel rounded-xl shadow-lg pointer-events-auto">
        <div className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center space-x-3">
            <NewLogo className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Navi<span className="font-light text-ash">Go</span>
            </h1>

            {/* Gemini Key Status Badge */}
            <button
              onClick={onGeminiKeyClick}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide transition-all ${
                keyConfigured 
                  ? 'bg-neon/10 border-neon/30 text-neon hover:bg-neon/20' 
                  : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 animate-pulse'
              }`}
              title="Configure Gemini AI Key"
            >
              <span>{keyConfigured ? '⚡ AI Key Active' : '🔑 Setup AI Key'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
             <div className="relative">
                {user ? (
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-neon to-azure flex items-center justify-center text-void text-xs font-bold">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="hidden md:inline text-sm font-medium text-gray-200 max-w-[80px] truncate">
                            {user.name ? user.name.split(' ')[0] : 'User'}
                        </span>
                        {/* Points Pill */}
                         <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-neon/10 rounded-full border border-neon/20 ml-2">
                             <div className="w-2 h-2 rounded-full bg-neon"></div>
                             <span className="text-[10px] text-neon font-mono font-bold">{user.greenPoints || 0}</span>
                         </div>
                    </button>
                ) : (
                    <button 
                        onClick={onLoginClick}
                        className="text-sm font-bold text-neon hover:text-green-300 px-3 py-1.5"
                    >
                        Login
                    </button>
                )}

                {isMenuOpen && user && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1E1E1E] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm text-ash">Signed in as</p>
                            <p className="text-sm font-bold text-white truncate">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2 py-0.5 bg-white/10 text-ash text-[10px] uppercase font-bold rounded">
                                    {user.role}
                                </span>
                                {user.isAmbassador && <span className="text-[10px] text-neon">★ Scout</span>}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onProfileClick(); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 flex items-center"
                        >
                            <span className="mr-2">👤</span> Your Profile & Stats
                        </button>

                        <button 
                            onClick={() => { setIsMenuOpen(false); onGeminiKeyClick(); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 flex items-center"
                        >
                            <span className="mr-2">🔑</span> Configure Gemini Key
                        </button>
                        
                        {(user.role === 'contributor' || user.role === 'admin') && (
                            <button 
                                onClick={() => { setIsMenuOpen(false); onAddBusClick(); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 flex items-center"
                            >
                                <span className="mr-2">🚌</span> Add Bus Route
                            </button>
                        )}

                        {user.role === 'admin' && (
                             <button 
                                onClick={() => { setIsMenuOpen(false); onAdminClick(); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 flex items-center"
                             >
                                <span className="mr-2">⚙️</span> Controller Dashboard
                             </button>
                        )}
                        
                        <button 
                            onClick={() => { setIsMenuOpen(false); onLogoutClick(); }}
                            className="w-full text-left px-4 py-3 text-sm text-coral hover:bg-coral/10 flex items-center border-t border-white/5"
                        >
                            <span className="mr-2">🚪</span> Log Out
                        </button>
                    </div>
                )}
             </div>

             <button
                onClick={onTogglePanel}
                className="p-2 rounded-full text-ash hover:bg-white/10 md:hidden"
             >
                 <MenuIcon className="h-6 w-6" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
