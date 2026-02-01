
import React from 'react';
import { OccupancyLevel } from '../types';

interface OccupancyReporterProps {
    onSubmit: (level: OccupancyLevel) => void;
    onClose: () => void;
}

const levels = [
    { id: OccupancyLevel.MANY_SEATS, label: 'Many Seats', color: 'bg-green-500', icon: '🟢' },
    { id: OccupancyLevel.FEW_SEATS, label: 'Few Seats', color: 'bg-yellow-500', icon: '🟡' },
    { id: OccupancyLevel.STANDING_ONLY, label: 'Standing Only', color: 'bg-orange-500', icon: '🟠' },
    { id: OccupancyLevel.CRUSHED, label: 'Crushed', color: 'bg-red-500', icon: '🔴' },
];

const OccupancyReporter: React.FC<OccupancyReporterProps> = ({ onSubmit, onClose }) => {
    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-40 animate-fade-in-up">
            <div className="glass-panel p-4 rounded-2xl shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-white font-bold mb-3 text-center text-sm">How full is the bus?</h3>
                
                <div className="grid grid-cols-2 gap-3">
                    {levels.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => onSubmit(level.id)}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 group"
                        >
                            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{level.icon}</span>
                            <span className="text-xs text-gray-300 group-hover:text-white font-medium">{level.label}</span>
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-center text-gray-500 mt-3">
                    Your report helps 500+ commuters nearby.
                    <span className="text-neon block">+10 Green Points</span>
                </p>
            </div>
        </div>
    );
};

export default OccupancyReporter;
