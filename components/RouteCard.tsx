
import React, { useState, useEffect } from 'react';
import { Route, TransportMode, User } from '../types';
import RouteSegment from './RouteSegment';
import BusIcon from './icons/BusIcon';
import TrainIcon from './icons/TrainIcon';
import WalkIcon from './icons/WalkIcon';
import AutoIcon from './icons/AutoIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { databaseService } from '../services/databaseService';
import { useToast } from '../context/ToastContext';

interface RouteCardProps {
  route: Route;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onStartJourney: (route: Route) => void;
  onRouteHover: (id: string | null) => void;
  onShare: () => void;
  user?: User | null;
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h > 0 ? `${h} hr ` : ''}${m > 0 ? `${m} min` : ''}`.trim() || '0 min';
};

const ModeIcon: React.FC<{ mode: TransportMode, className?: string }> = ({ mode, className }) => {
    const icons: { [key in TransportMode]?: React.FC<React.SVGProps<SVGSVGElement>> } = {
        [TransportMode.BUS]: BusIcon,
        [TransportMode.TRAIN]: TrainIcon,
        [TransportMode.WALK]: WalkIcon,
        [TransportMode.AUTO]: AutoIcon,
        [TransportMode.TAXI]: AutoIcon,
    };
    const Icon = icons[mode] || WalkIcon;
    return <Icon className={className || "h-4 w-4"} />;
};

const RouteCard: React.FC<RouteCardProps> = ({ route, isExpanded, onToggleExpand, onStartJourney, onRouteHover, user }) => {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [isSaved, setIsSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
      if (user && user.id !== 'guest-traveler') {
          databaseService.getSavedRoutes(user.id).then(saved => {
              setIsSaved(saved.some(r => r.id === route.id));
          });
      }
  }, [user, route.id]);

  // Build a rich shareable text summary of the route
  const buildShareText = (): string => {
    const modeLabels: Record<string, string> = {
      BUS: 'Bus', TRAIN: 'Train', WALK: 'Walk', AUTO: 'Auto', TAXI: 'Taxi', METRO: 'Metro'
    };
    const segmentLines = route.segments.map((seg, i) => {
      const mode = modeLabels[seg.mode] || seg.mode;
      const cost = seg.costINR > 0 ? ` • ₹${seg.costINR}` : '';
      return `  ${i + 1}. ${mode}: ${seg.from} → ${seg.to} (${seg.durationMinutes} min${cost})`;
    }).join('\n');

    return [
      `🗺️ NaviGo Route: ${route.name}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⏱️ Duration: ${formatDuration(route.totalDurationMinutes)}`,
      `💰 Cost: ₹${route.totalCostINR}`,
      `📌 Category: ${route.category === 'BALANCED' ? 'Recommended' : route.category === 'TIME_EFFICIENT' ? 'Fastest' : 'Cheapest'}`,
      ``,
      `📍 Steps:`,
      segmentLines,
      ``,
      `${route.summary}`,
      ``,
      `🌱 Powered by NaviGo — https://navigo-proto.vercel.app`
    ].join('\n');
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = buildShareText();
    const shareTitle = `NaviGo Route: ${route.name}`;

    // Try native Web Share API first (works on mobile & some desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: 'https://navigo-proto.vercel.app'
        });
        setShareState('shared');
        showToast('Route shared successfully!', 'success');
        setTimeout(() => setShareState('idle'), 2000);
        return;
      } catch (err: any) {
        // User cancelled share or API not fully supported — fall through to clipboard
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareState('copied');
      showToast('Route copied to clipboard!', 'success');
      setTimeout(() => setShareState('idle'), 2500);
    } catch (err) {
      // Final fallback: textarea trick
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShareState('copied');
      showToast('Route copied to clipboard!', 'success');
      setTimeout(() => setShareState('idle'), 2500);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user || user.id === 'guest-traveler') {
          showToast("Sign in to save routes", 'info');
          return;
      }
      if (savingInProgress) return;
      setSavingInProgress(true);

      try {
        if (isSaved) {
            await databaseService.deleteSavedRoute(user.id, route.id);
            setIsSaved(false);
            showToast("Route removed from saved", 'info');
        } else {
            await databaseService.saveRoute(user.id, route);
            setIsSaved(true);
            showToast("Route saved! View in your profile.", 'success');
        }
      } catch (err) {
        showToast("Failed to update saved routes", 'error');
      } finally {
        setSavingInProgress(false);
      }
  };

  const categoryConfig = {
    BALANCED: {
      color: 'blue',
      label: 'Recommended',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500'
    },
    TIME_EFFICIENT: {
      color: 'purple',
      label: 'Fastest',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500'
    },
    BUDGET_FRIENDLY: {
      color: 'emerald',
      label: 'Cheapest',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500'
    }
  };
  
  const conf = categoryConfig[route.category];

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300 overflow-hidden ${isExpanded ? `ring-2 ring-${conf.color}-500 ring-offset-2 dark:ring-offset-gray-900` : 'hover:shadow-lg hover:translate-y-[-2px]'}`}
      onMouseEnter={() => onRouteHover(route.id)}
      onMouseLeave={() => onRouteHover(null)}
    >
        {/* Compact Header Row */}
        <div 
            className="p-4 cursor-pointer"
            onClick={() => onToggleExpand(route.id)}
        >
            <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${conf.bg} ${conf.text}`}>
                        {conf.label}
                    </span>
                 </div>
                 <div className="flex items-center space-x-3">
                    {/* Action Buttons — always visible */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleSaveClick}
                            disabled={savingInProgress}
                            className={`p-1.5 rounded-full transition-all duration-200 ${
                              isSaved 
                                ? 'text-neon bg-neon/10 hover:bg-neon/20' 
                                : 'text-gray-400 hover:text-neon hover:bg-gray-100 dark:hover:bg-gray-700'
                            } ${savingInProgress ? 'opacity-50' : ''}`}
                            title={isSaved ? "Remove from saved" : "Save route"}
                        >
                            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleShareClick}
                            className={`p-1.5 rounded-full transition-all duration-200 ${
                              shareState !== 'idle'
                                ? 'text-neon bg-neon/10'
                                : 'text-gray-400 hover:text-azure hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title="Share route"
                        >
                            {shareState === 'copied' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : shareState === 'shared' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <span className="block text-xl font-bold text-gray-900 dark:text-white">
                        ₹{route.totalCostINR}
                    </span>
                 </div>
            </div>

            <div className="flex justify-between items-end">
                <div>
                     <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                        {formatDuration(route.totalDurationMinutes)}
                     </h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {route.summary}
                     </p>
                </div>
                
                {/* Mode Icons Strip */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1.5 rounded-lg">
                    {route.modeSummary.map((mode, index) => (
                        <React.Fragment key={index}>
                            <ModeIcon mode={mode} className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                            {index < route.modeSummary.length - 1 && <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
      
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="p-4 space-y-0">
             {/* Timeline connector line */}
             <div className="absolute left-[27px] top-[100px] bottom-[80px] w-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
            {route.segments.map((segment, index) => (
              <RouteSegment key={index} segment={segment} />
            ))}
          </div>
          <div className="p-4 pt-0 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onStartJourney(route); }}
              className={`flex-1 bg-gradient-to-r from-${conf.color}-500 to-${conf.color}-600 hover:from-${conf.color}-600 hover:to-${conf.color}-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition-transform active:scale-95 flex items-center justify-center space-x-2`}
            >
              <span>Start Navigation</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleSaveClick}
              disabled={savingInProgress}
              className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border ${
                isSaved 
                  ? 'bg-neon/10 border-neon/30 text-neon hover:bg-neon/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              } ${savingInProgress ? 'opacity-50' : ''}`}
              title={isSaved ? "Saved" : "Save"}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={handleShareClick}
              className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border ${
                shareState !== 'idle'
                  ? 'bg-neon/10 border-neon/30 text-neon'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
              title="Share route"
            >
              {shareState !== 'idle' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RouteCard);

