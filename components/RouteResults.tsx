
import React from 'react';
import { Route, User } from '../types';
import RouteCard from './RouteCard';

interface RouteResultsProps {
  routes: Route[];
  user: User | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  hasSearched: boolean;
  expandedRouteId: string | null;
  onToggleExpand: (id: string) => void;
  onStartJourney: (route: Route) => void;
  onRouteHover: (id: string | null) => void;
  onShare: () => void;
}

const RouteCardSkeleton: React.FC = () => (
    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 animate-pulse">
        <div className="flex justify-between mb-4">
            <div className="w-24 h-5 bg-white/10 rounded-md"></div>
            <div className="w-16 h-8 bg-white/10 rounded-md"></div>
        </div>
        <div className="space-y-3">
            <div className="w-1/3 h-6 bg-white/10 rounded-md"></div>
            <div className="w-full h-3 bg-white/5 rounded-md"></div>
            <div className="flex space-x-2 pt-4">
                <div className="w-8 h-8 rounded-full bg-white/10"></div>
                <div className="w-8 h-8 rounded-full bg-white/10"></div>
            </div>
        </div>
    </div>
);

const RouteResults: React.FC<RouteResultsProps> = ({ routes, user, isLoading, loadingMessage, error, hasSearched, expandedRouteId, onToggleExpand, onStartJourney, onRouteHover, onShare }) => {

  if (error) {
    return (
      <div className="text-center p-8 bg-coral/10 border border-coral/30 rounded-2xl animate-fade-in">
        <div className="bg-coral/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-white">Navigation Interrupted</h3>
        <p className="text-sm text-ash mt-2">{error}</p>
      </div>
    );
  }

  if (!hasSearched && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 animate-fade-in">
        <div className="bg-neon/10 p-5 rounded-full mb-5 shadow-inner">
            <svg className="w-10 h-10 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">System Ready</h3>
        <p className="text-ash mt-2 text-sm max-w-xs leading-relaxed">NaviGo Mobility Intelligence is active. Input origin and destination to calculate road-accurate paths.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
        {routes.map((route) => (
          <RouteCard 
            key={route.id} 
            route={route} 
            user={user}
            isExpanded={route.id === expandedRouteId}
            onToggleExpand={onToggleExpand}
            onStartJourney={onStartJourney}
            onRouteHover={onRouteHover}
            onShare={onShare}
          />
        ))}
        
        {isLoading && (
            <div className="space-y-4 pt-2">
                 <div className="flex items-center justify-center space-x-3 py-2">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-xs font-bold text-neon uppercase tracking-widest animate-pulse">{loadingMessage || 'NaviGo Calculating...'}</span>
                 </div>
                <RouteCardSkeleton />
                <RouteCardSkeleton />
            </div>
        )}
    </div>
  );
};

export default React.memo(RouteResults);
