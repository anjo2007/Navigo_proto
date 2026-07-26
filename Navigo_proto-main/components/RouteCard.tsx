
import React, { useState, useEffect } from 'react';
import { Route, TransportMode, User } from '../types';
import RouteSegment from './RouteSegment';
import BusIcon from './icons/BusIcon';
import TrainIcon from './icons/TrainIcon';
import WalkIcon from './icons/WalkIcon';
import AutoIcon from './icons/AutoIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ShareIcon from './icons/ShareIcon';
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

const RouteCard: React.FC<RouteCardProps> = ({ route, isExpanded, onToggleExpand, onStartJourney, onRouteHover, onShare, user }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
      if (user) {
          databaseService.getSavedRoutes(user.id).then(saved => {
              setIsSaved(saved.some(r => r.id === route.id));
          });
      }
  }, [user, route.id]);

  const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onShare();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
          showToast("Login to save journeys", 'info');
          return;
      }
      if (isSaved) {
          await databaseService.deleteSavedRoute(user.id, route.id);
          setIsSaved(false);
          showToast("Journey removed from vault", 'info');
      } else {
          await databaseService.saveRoute(user.id, route);
          setIsSaved(true);
          showToast("Journey secured in vault", 'success');
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
                    {/* Action Buttons */}
                    <div className={`flex items-center space-x-1 transition-all ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handleSaveClick}
                            className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${isSaved ? 'text-neon' : 'text-gray-400'}`}
                            title={isSaved ? "Saved" : "Save to Vault"}
                        >
                            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleShareClick}
                            className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${isCopied ? 'text-green-500' : 'text-gray-400'}`}
                            title="Share Route Plan"
                        >
                            {isCopied ? (
                                <span className="text-[10px] font-bold">COPIED</span>
                            ) : (
                                <ShareIcon className="w-4 h-4" />
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
          <div className="p-4 pt-0">
            <button
              onClick={(e) => { e.stopPropagation(); onStartJourney(route); }}
              className={`w-full bg-gradient-to-r from-${conf.color}-500 to-${conf.color}-600 hover:from-${conf.color}-600 hover:to-${conf.color}-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition-transform active:scale-95 flex items-center justify-center space-x-2`}
            >
              <span>Start Navigation</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RouteCard);
