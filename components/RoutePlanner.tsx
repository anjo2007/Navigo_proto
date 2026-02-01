
import React, { useState, useCallback, Suspense, lazy, useEffect, useMemo } from 'react';
import { Coordinate, Route, TransportMode, UserPreferences, User, PlaceResult } from '../types';
import { streamRoutes, searchNearbyPlaces } from '../services/geminiService';
import RouteSearchForm from './RouteSearchForm';
import RouteResults from './RouteResults';
import LoadingSpinner from './LoadingSpinner';
import Header from './Header';
import PanelHandle from './PanelHandle';
import TravelAssistant from './TravelAssistant';
import { useWindowSize } from '../hooks/useWindowSize';
import LocalResultsPanel from './LocalResultsPanel';

const JourneyView = lazy(() => import('./JourneyView'));
const MapView = lazy(() => import('./MapView'));

type SelectionMode = 'start' | 'destination' | null;

interface RoutePlannerProps {
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onAdminClick: () => void;
    onProfileClick: () => void;
    onAddBusClick: () => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ user, onLoginClick, onLogoutClick, onAdminClick, onProfileClick, onAddBusClick }) => {
  const [start, setStart] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [travelerProfile] = useState<string>('Solo Commuter');
  const [avoidModes, setAvoidModes] = useState<TransportMode[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
      walkingTolerance: 'medium',
      priority: 'balanced'
  });
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeJourney, setActiveJourney] = useState<Route | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Local Search Feature
  const [localSearchCategory, setLocalSearchCategory] = useState<string | null>(null);
  const [localResults, setLocalResults] = useState<PlaceResult[]>([]);
  const [localSources, setLocalSources] = useState<{title: string; uri: string}[]>([]);
  
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    setIsPanelOpen(!isMobile);
  }, [isMobile]);

  const handleSearch = useCallback(async () => {
    if (!start || !destination) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setRoutes([]);
    setLocalSearchCategory(null);
    setExpandedRouteId(null);
    setActiveJourney(null);
    setLoadingMessage("NaviGo AI optimizing your path...");

    const onRouteReceived = (route: Route) => {
      setRoutes(prev => [...prev, route]);
      setLoadingMessage(`High-accuracy ${route.category} found.`);
      if (isMobile) setIsPanelOpen(true);
    };

    const onComplete = () => {
        setIsLoading(false);
        setLoadingMessage('');
    };
    
    const onError = (err: Error) => {
        setIsLoading(false);
        setError("Routing failed. Please retry.");
    };

    streamRoutes(start, destination, travelerProfile, avoidModes, preferences, onRouteReceived, onComplete, onError);
  }, [start, destination, travelerProfile, avoidModes, preferences, isMobile]);

  const handleNearbySearch = async (category: string) => {
    setIsLoading(true);
    setLocalSearchCategory(category);
    setHasSearched(true);
    setRoutes([]);
    setLoadingMessage(`Locating ${category} near you...`);
    
    try {
        const locationStr = start || "my current location";
        const { results, sources } = await searchNearbyPlaces(category, locationStr);
        setLocalResults(results);
        setLocalSources(sources);
    } catch (e) {
        setError("Search failed.");
    } finally {
        setIsLoading(false);
        setLoadingMessage("");
    }
  };

  const handleRouteSelection = useCallback((id: string) => {
    setExpandedRouteId(currentId => (currentId === id ? null : id));
  }, []);

  const inputStartCoord = useMemo(() => {
    const match = start.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[3]) } : null;
  }, [start]);

  const inputEndCoord = useMemo(() => {
    const match = destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[3]) } : null;
  }, [destination]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<LoadingSpinner message="Assembling Map Engine..."/>}>
            <MapView
            routes={routes}
            expandedRouteId={expandedRouteId}
            hoveredRouteId={hoveredRouteId}
            activeJourney={activeJourney}
            currentSegmentIndex={currentSegmentIndex}
            onRouteSelect={handleRouteSelection}
            selectionMode={selectionMode !== null}
            onMapClick={(c) => {
                const mode = selectionMode;
                setSelectionMode(null);
                const s = `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
                if (mode === 'start') setStart(s); else setDestination(s);
            }}
            inputStartCoord={inputStartCoord}
            inputEndCoord={inputEndCoord}
            />
        </Suspense>
      </div>

      <Header 
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)} 
        isPanelOpen={isPanelOpen}
        user={user}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onAdminClick={onAdminClick}
        onProfileClick={onProfileClick}
        onAddBusClick={onAddBusClick}
      />

      <TravelAssistant start={start} destination={destination} activeRouteId={expandedRouteId || undefined} />

      <div className={`absolute z-20 transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1)
        md:top-6 md:bottom-6 md:left-6 md:w-[460px]
        bottom-0 left-0 right-0 max-h-[92vh]
        ${isMobile 
            ? (isPanelOpen ? 'translate-y-0 h-[88vh]' : 'translate-y-[calc(100%-80px)] h-[88vh]') 
            : (isPanelOpen ? 'translate-x-0' : '-translate-x-[115%]')
        }`}>
          <div className="flex flex-col h-full glass-panel rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
             {isMobile && (
                <div onClick={() => setIsPanelOpen(!isPanelOpen)} className="w-full py-4 flex justify-center items-center cursor-pointer bg-white/5">
                  <PanelHandle />
                </div>
             )}

             <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                 <RouteSearchForm
                    start={start}
                    destination={destination}
                    travelerProfile={travelerProfile}
                    avoidModes={avoidModes}
                    preferences={preferences}
                    onStartChange={setStart}
                    onDestinationChange={setDestination}
                    onTravelerProfileChange={()=>{}}
                    onAvoidModesChange={setAvoidModes}
                    onPreferencesChange={setPreferences}
                    onSearch={handleSearch}
                    onNearbySearch={handleNearbySearch}
                    isLoading={isLoading}
                    onSetSelectionMode={setSelectionMode}
                    selectionMode={selectionMode}
                  />
                  
                  {activeJourney ? (
                     <div className="mt-8">
                         <Suspense fallback={<LoadingSpinner />}>
                          <JourneyView 
                            journey={activeJourney}
                            currentSegmentIndex={currentSegmentIndex}
                            onNext={() => currentSegmentIndex < activeJourney.segments.length - 1 && setCurrentSegmentIndex(prev => prev + 1)}
                            onPrevious={() => currentSegmentIndex > 0 && setCurrentSegmentIndex(prev => prev - 1)}
                            onExit={() => { setActiveJourney(null); if(isMobile) setIsPanelOpen(true); }}
                            user={user}
                          />
                        </Suspense>
                     </div>
                  ) : localSearchCategory ? (
                      <LocalResultsPanel 
                        category={localSearchCategory} 
                        results={localResults} 
                        sources={localSources} 
                        onClose={() => setLocalSearchCategory(null)}
                        onNavigate={(p) => setDestination(p.address)}
                      />
                  ) : (
                    <div className="mt-8 pb-24 md:pb-0">
                      <RouteResults
                        routes={routes}
                        user={user}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        error={error}
                        hasSearched={hasSearched}
                        expandedRouteId={expandedRouteId}
                        onToggleExpand={handleRouteSelection}
                        onStartJourney={(r) => { setActiveJourney(r); setCurrentSegmentIndex(0); if(isMobile) setIsPanelOpen(false); }}
                        onRouteHover={setHoveredRouteId}
                        onShare={() => {}}
                      />
                    </div>
                  )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
