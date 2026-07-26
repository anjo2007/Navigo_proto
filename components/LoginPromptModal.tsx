import React from 'react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose, onLoginClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0F172A] w-full max-w-md rounded-3xl border border-neon/40 shadow-[0_0_80px_rgba(0,230,118,0.2)] overflow-hidden flex flex-col relative animate-fade-in-up">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-neon via-azure to-purple-500"></div>

        <div className="p-6 md:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center text-neon mx-auto shadow-inner">
            <svg className="w-8 h-8 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Enjoying Navigo?</h3>
            <p className="text-xs text-ash mt-1.5 leading-relaxed">
              Log in or create a free account to earn <strong className="text-neon">Green Points</strong>, save your favorite routes, and unlock community Scout features!
            </p>
          </div>

          <div className="bg-obsidian/80 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center space-x-3 text-xs text-mist">
              <svg className="w-4 h-4 text-neon flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Earn +10 Green Points per crowd report</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-mist">
              <svg className="w-4 h-4 text-azure flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Save road-accurate routes to your vault</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-mist">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Climb the global Scout Leaderboard</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              className="w-full bg-neon text-void font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-green-400 active:scale-98 shadow-[0_0_25px_rgba(0,230,118,0.35)] transition-all"
            >
              Log In / Sign Up Now
            </button>
            <button
              onClick={onClose}
              className="w-full bg-white/5 border border-white/10 text-ash hover:text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
