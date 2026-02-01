
import React, { useMemo, useState } from 'react';
import { RouteSegment as Segment, TransportMode, ScheduledOption } from '../types';
import BusIcon from './icons/BusIcon';
import TrainIcon from './icons/TrainIcon';
import WalkIcon from './icons/WalkIcon';
import AutoIcon from './icons/AutoIcon';
import { getRealtimeSchedules } from '../services/geminiService';

interface RouteSegmentProps {
  segment: Segment;
}

const IconMap: { [key in TransportMode]?: React.FC<React.SVGProps<SVGSVGElement>> } = {
  [TransportMode.BUS]: BusIcon,
  [TransportMode.TRAIN]: TrainIcon,
  [TransportMode.WALK]: WalkIcon,
  [TransportMode.AUTO]: AutoIcon,
  [TransportMode.TAXI]: AutoIcon,
};

const RouteSegment: React.FC<RouteSegmentProps> = ({ segment }) => {
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledOption[]>([]);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const Icon = IconMap[segment.mode] || WalkIcon;

  const handleToggleSchedules = async () => {
    if (!isSchedulesOpen && (schedules.length === 0)) {
        setIsLoadingSchedules(true);
        setIsSchedulesOpen(true);
        const { options, sources: src } = await getRealtimeSchedules(segment.mode, segment.start, segment.end);
        setSchedules(options);
        setSources(src);
        setIsLoadingSchedules(false);
    } else {
        setIsSchedulesOpen(!isSchedulesOpen);
    }
  };

  const isTransit = segment.mode === TransportMode.BUS || segment.mode === TransportMode.TRAIN;

  return (
    <div className="flex items-start space-x-3 relative z-10 group animate-fade-in-up">
      <div className="flex flex-col items-center pt-1">
        <span className={`flex items-center justify-center h-8 w-8 rounded-full bg-obsidian ring-4 ring-white/5 text-neon shadow-lg transition-transform group-hover:scale-110`}>
            <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex-grow pb-6 border-l border-white/10 ml-4 pl-6 -ml-4">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-mist capitalize tracking-tight">{segment.mode.toLowerCase()}</p>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-mono text-ash">{segment.durationMinutes}m</span>
                </div>
                <p className="text-sm text-ash mt-1 leading-snug">{segment.details}</p>
            </div>
        </div>
        
        {isTransit && (
            <div className="mt-3">
                <button 
                    onClick={handleToggleSchedules}
                    className="text-[10px] font-bold uppercase tracking-widest text-azure hover:text-white transition-colors flex items-center bg-azure/5 px-3 py-1.5 rounded-lg border border-azure/20"
                >
                    {isSchedulesOpen ? 'Collapse Timings' : 'Expand Live Timings'}
                    <span className={`ml-2 transform transition-transform ${isSchedulesOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                </button>

                {isSchedulesOpen && (
                    <div className="mt-3 space-y-3 animate-fade-in border-l-2 border-azure/30 pl-4">
                        {isLoadingSchedules ? (
                            <div className="flex items-center space-x-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-4 h-4 border-2 border-azure border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-ash">Grounding transit data...</span>
                            </div>
                        ) : schedules.length > 0 ? (
                            <>
                                <p className="text-[10px] font-bold text-ash uppercase tracking-tighter">Upcoming {segment.mode.toLowerCase()}s:</p>
                                {schedules.map((opt) => (
                                    <div key={opt.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-sm font-bold text-mist block">{opt.name}</span>
                                                <span className="text-[10px] text-ash font-medium uppercase">{opt.operator || 'Official Service'}</span>
                                            </div>
                                            <span className="text-sm font-bold text-neon bg-neon/10 px-2 py-0.5 rounded">₹{opt.priceINR}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-ash font-mono">
                                            <div className="bg-white/5 p-2 rounded-lg">
                                                <p className="text-[9px] text-azure uppercase font-bold mb-0.5">Start</p>
                                                <p className="font-bold text-white">{opt.startTime}</p>
                                                <p className="truncate opacity-70">{opt.startLocation}</p>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-lg text-right">
                                                <p className="text-[9px] text-coral uppercase font-bold mb-0.5">End</p>
                                                <p className="font-bold text-white">{opt.endTime}</p>
                                                <p className="truncate opacity-70">{opt.endLocation}</p>
                                            </div>
                                        </div>
                                        {opt.occupancyHint && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    opt.occupancyHint === 'LOW' ? 'bg-neon shadow-[0_0_5px_rgba(0,230,118,1)]' : 
                                                    opt.occupancyHint === 'MEDIUM' ? 'bg-yellow-500' : 'bg-coral'
                                                }`}></div>
                                                <span className="text-[9px] font-bold text-ash uppercase">{opt.occupancyHint} Occupancy</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {sources.length > 0 && (
                                    <div className="pt-1 flex flex-wrap gap-2">
                                        {sources.slice(0, 2).map((s, i) => (
                                            <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] text-azure hover:underline opacity-50 truncate max-w-[150px]">Source: {s.title}</a>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-xs text-ash p-4 bg-white/5 rounded-xl border border-white/5 italic">
                                No real-time schedules found for this route segment.
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-3">
             <a
                href={useMemo(() => {
                    const origin = segment.start;
                    const dest = segment.end;
                    let mode = 'driving';
                    if (segment.mode === TransportMode.WALK) mode = 'walking';
                    if ([TransportMode.BUS, TransportMode.TRAIN].includes(segment.mode)) mode = 'transit';
                    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`;
                }, [segment])}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-azure/20 text-azure border border-azure/30 hover:bg-azure hover:text-white py-1.5 px-4 rounded-full transition-all"
            >
                Start Nav
            </a>

            {segment.costINR > 0 && !isSchedulesOpen && (
                 <span className="inline-flex items-center text-xs text-ash font-mono pt-1">
                    Est. Cost: ₹{segment.costINR}
                 </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RouteSegment);
