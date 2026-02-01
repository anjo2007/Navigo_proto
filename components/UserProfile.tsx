
import React, { useEffect, useState } from 'react';
import { User, LeaderboardEntry, SavedRoute } from '../types';
import { databaseService } from '../services/databaseService';

interface UserProfileProps {
    user: User;
    onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'saved' | 'leaderboard'>('stats');

    useEffect(() => {
        databaseService.getLeaderboard().then(setLeaderboard);
        databaseService.getSavedRoutes(user.id).then(setSavedRoutes);
    }, [user.id]);

    const getTrustLabel = (score: number) => {
        if (score >= 90) return { label: 'Elite Source', color: 'text-neon', border: 'border-neon/30' };
        if (score >= 70) return { label: 'Trusted', color: 'text-azure', border: 'border-azure/30' };
        if (score >= 50) return { label: 'Regular', color: 'text-white', border: 'border-white/10' };
        return { label: 'Unverified', color: 'text-coral', border: 'border-coral/30' };
    };

    const trust = getTrustLabel(user.trustScore);

    const handleDeleteSaved = async (id: string) => {
        await databaseService.deleteSavedRoute(user.id, id);
        setSavedRoutes(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
            <div className="pointer-events-auto w-full md:w-[540px] bg-void border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up will-change-sharp">
                
                {/* Header Section */}
                <div className="relative p-8 bg-gradient-to-br from-void to-obsidian border-b border-white/5">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-ash hover:text-white transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-neon via-azure to-purple-600 p-0.5 shadow-[0_0_20px_rgba(0,230,118,0.2)]">
                                <div className="w-full h-full rounded-full bg-void flex items-center justify-center text-4xl font-bold text-white uppercase tracking-tighter">
                                    {user.name.charAt(0)}
                                </div>
                            </div>
                            {user.isAmbassador && (
                                <div className="absolute -bottom-1 -right-1 bg-neon text-void p-1.5 rounded-full border-2 border-void shadow-lg" title="NaviGo Ambassador">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-white tracking-tight leading-none">{user.name}</h2>
                            <p className="text-xs text-ash font-mono mt-2 opacity-60 tracking-wider truncate">{user.email}</p>
                            <div className="flex items-center space-x-3 mt-4">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 text-mist text-[10px] uppercase font-bold tracking-widest rounded-md">
                                    {user.role.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${trust.color}`}>
                                    {trust.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-white/5 bg-void/50">
                    {(['stats', 'saved', 'leaderboard'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                                activeTab === tab ? 'text-neon border-b-2 border-neon bg-neon/5' : 'text-ash hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-void">
                    {activeTab === 'stats' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-obsidian/40 p-6 rounded-2xl border border-neon/20 flex flex-col items-center justify-center text-center transition-all hover:border-neon/40 shadow-inner">
                                    <span className="text-5xl font-black text-neon mb-1 drop-shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                                        {user.greenPoints}
                                    </span>
                                    <span className="text-[10px] text-ash uppercase font-black tracking-widest opacity-80">Green Points</span>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-6 overflow-hidden">
                                        <div className="bg-neon h-full transition-all duration-1000" style={{ width: `${(user.greenPoints % 1000) / 10}%` }}></div>
                                    </div>
                                    <span className="text-[9px] text-gray-500 mt-2 uppercase font-bold">NEXT BADGE: 2000 PTS</span>
                                </div>
                                <div className={`bg-obsidian/40 p-6 rounded-2xl border ${trust.border} flex flex-col items-center justify-center text-center transition-all hover:bg-white/5 shadow-inner`}>
                                    <span className={`text-5xl font-black mb-1 ${trust.color} drop-shadow-[0_0_15px_rgba(41,121,255,0.2)]`}>
                                        {user.trustScore}%
                                    </span>
                                    <span className="text-[10px] text-ash uppercase font-black tracking-widest opacity-80">Credibility</span>
                                    <div className="mt-6 flex space-x-1.5">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${user.trustScore >= i*20 ? trust.color.replace('text', 'bg') : 'bg-white/5'}`}></div>
                                        ))}
                                    </div>
                                    <span className={`text-[9px] mt-2 uppercase font-bold ${trust.color}`}>{trust.label}</span>
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 shadow-sm">
                                <h4 className="text-[10px] font-black text-ash uppercase tracking-widest mb-6 opacity-60">Achievement Progress</h4>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/10">🏆</div>
                                            <div>
                                                <p className="text-sm font-bold text-mist">First Contribution</p>
                                                <p className="text-[10px] text-ash font-medium">Earned on joining NaviGo</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-neon font-black bg-neon/5 px-2 py-1 rounded">VERIFIED</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-azure/10 rounded-xl flex items-center justify-center text-azure border border-azure/10">🚌</div>
                                            <div>
                                                <p className="text-sm font-bold text-mist">Route Master</p>
                                                <p className="text-[10px] text-ash font-medium">10 Bus Reports Required</p>
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-mist font-bold font-mono">4/10</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'saved' && (
                        <div className="space-y-4 animate-fade-in">
                            {savedRoutes.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center opacity-20">
                                    <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                    <p className="text-lg font-bold">Your vault is empty</p>
                                    <p className="text-xs mt-2 max-w-[200px] leading-relaxed font-medium">Save road-accurate journeys to access them offline and instantly.</p>
                                </div>
                            ) : (
                                savedRoutes.map(route => (
                                    <div key={route.id} className="bg-obsidian border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-azure/40 hover:bg-white/5 transition-all duration-300">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-md font-bold text-white tracking-tight">{route.name}</span>
                                                <span className="text-[9px] bg-azure/10 text-azure px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-azure/20">{route.category}</span>
                                            </div>
                                            <p className="text-xs text-ash mt-1.5 font-medium leading-relaxed opacity-70">{route.summary}</p>
                                            <div className="flex items-center space-x-4 mt-3">
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="text-[10px] font-black text-neon uppercase">INR {route.totalCostINR}</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 font-mono text-[10px] text-ash uppercase">
                                                    <span>{route.totalDurationMinutes} MINS</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-3 ml-4">
                                            <button 
                                                onClick={() => handleDeleteSaved(route.id)}
                                                className="p-2 text-ash hover:text-coral hover:bg-coral/10 rounded-xl transition-all"
                                                title="Erase from vault"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            <button className="bg-azure text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(41,121,255,0.3)] transition-all">
                                                Navigate
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <div className="space-y-3 animate-fade-in">
                            <h4 className="text-[10px] font-black text-ash uppercase tracking-widest mb-6 opacity-60">Top Scout Network Members</h4>
                            {leaderboard.map((entry, idx) => (
                                <div 
                                    key={entry.userId} 
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                        entry.userId === user.id 
                                        ? 'bg-neon/5 border-neon shadow-[0_0_20px_rgba(0,230,118,0.05)]' 
                                        : 'bg-obsidian border-white/5'
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-inner ${
                                            idx === 0 ? 'bg-yellow-500 text-void ring-4 ring-yellow-500/10' :
                                            idx === 1 ? 'bg-gray-400 text-void' :
                                            idx === 2 ? 'bg-orange-600 text-void' :
                                            'bg-void text-ash border border-white/10'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm text-mist font-bold flex items-center">
                                                {entry.userId === user.id ? 'YOU (Verified Node)' : entry.userName}
                                                {idx < 3 && <span className="ml-2 text-xs">⭐</span>}
                                            </div>
                                            <div className="text-[10px] text-ash uppercase font-bold tracking-widest mt-0.5 opacity-50">Global Rank #{idx + 1}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-black text-neon text-lg tracking-tighter">
                                            {entry.points}
                                        </div>
                                        <div className="text-[9px] text-ash uppercase font-black tracking-widest opacity-40">Points</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
