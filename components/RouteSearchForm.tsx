
import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { getPlaceSuggestions } from '../services/geminiService';
import MyLocationIcon from './icons/MyLocationIcon';
import MapPinIcon from './icons/MapPinIcon';
import CrosshairIcon from './icons/CrosshairIcon';
import { TransportMode, UserPreferences } from '../types';

type SelectionMode = 'start' | 'destination' | null;

interface RouteSearchFormProps {
  start: string;
  destination: string;
  travelerProfile: string;
  avoidModes: TransportMode[];
  preferences: UserPreferences;
  onStartChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onTravelerProfileChange: (value: string) => void;
  onAvoidModesChange: (modes: TransportMode[]) => void;
  onPreferencesChange: (prefs: UserPreferences) => void;
  onSearch: () => void;
  onNearbySearch: (category: string) => void;
  isLoading: boolean;
  onSetSelectionMode: (mode: SelectionMode) => void;
  selectionMode: SelectionMode;
}

const RouteSearchForm: React.FC<RouteSearchFormProps> = ({
  start,
  destination,
  travelerProfile,
  avoidModes,
  preferences,
  onStartChange,
  onDestinationChange,
  onTravelerProfileChange,
  onAvoidModesChange,
  onPreferencesChange,
  onSearch,
  onNearbySearch,
  isLoading,
  onSetSelectionMode,
  selectionMode,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const debouncedStart = useDebounce(start, 500);
  const debouncedDestination = useDebounce(destination, 500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowStartSuggestions(false);
    setShowDestSuggestions(false);
    onSearch();
  };

  const handleGetLocation = useCallback(async () => {
    setIsLocating(true);
    const originalValue = start;
    onStartChange('Fetching GPS location...');

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        const { latitude, longitude } = position.coords;
        onStartChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } catch (error) {
        onStartChange(originalValue);
      } finally {
        setIsLocating(false);
      }
    } else {
      onStartChange(originalValue);
      setIsLocating(false);
    }
  }, [onStartChange, start]);

  useEffect(() => {
    if (debouncedStart.length > 2 && !start.startsWith('Fetching')) {
      getPlaceSuggestions(debouncedStart).then(setStartSuggestions);
    } else {
      setStartSuggestions([]);
    }
  }, [debouncedStart]);

  useEffect(() => {
    if (debouncedDestination.length > 2) {
      getPlaceSuggestions(debouncedDestination).then(setDestSuggestions);
    } else {
      setDestSuggestions([]);
    }
  }, [debouncedDestination]);

  const quickCategories = [
    { label: 'Food', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 12 0z"/><path d="M12 2v6"/><path d="M12 14v8"/></svg>, category: 'restaurants' },
    { label: 'Hospitals', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 7v6M9 10h6"/></svg>, category: 'hospitals' },
    { label: 'Fuel', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M13 11l4-4a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L17 14v4a2 2 0 0 1-2 2h-2"/><rect x="5" y="6" width="6" height="5" rx="1"/></svg>, category: 'petrol pumps' },
    { label: 'Parks', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L7 10h3l-4 7h6v5h2v-5h6l-4-7h3z"/></svg>, category: 'parks' },
    { label: 'Hotels', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M9 6h6M9 10h6M9 14h6M9 18h6"/></svg>, category: 'hotels' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="w-5 h-5 text-blue-500" />
            </div>
            <input
                type="text"
                value={start}
                placeholder="Start Location"
                onChange={(e) => { onStartChange(e.target.value); setShowStartSuggestions(true); }}
                onFocus={() => setShowStartSuggestions(true)}
                onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                className="w-full bg-obsidian border border-white/10 rounded-xl py-3.5 pl-10 pr-20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                disabled={isLoading || isLocating}
                autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                <button type="button" onClick={handleGetLocation} className="p-2 text-ash hover:text-white"><MyLocationIcon className="w-5 h-5"/></button>
                <button type="button" onClick={() => onSetSelectionMode(selectionMode === 'start' ? null : 'start')} className={`p-2 rounded-full ${selectionMode === 'start' ? 'text-white bg-purple-600' : 'text-ash'}`}><CrosshairIcon className="w-5 h-5"/></button>
            </div>
            {showStartSuggestions && startSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-obsidian border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-auto">
                {startSuggestions.map((s, i) => <li key={i} className="px-4 py-3 text-sm text-ash hover:bg-white/5 cursor-pointer" onMouseDown={() => { onStartChange(s); setShowStartSuggestions(false); }}>{s}</li>)}
                </ul>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="w-5 h-5 text-red-500" />
            </div>
            <input
                type="text"
                value={destination}
                placeholder="Destination"
                onChange={(e) => { onDestinationChange(e.target.value); setShowDestSuggestions(true); }}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                className="w-full bg-obsidian border border-white/10 rounded-xl py-3.5 pl-10 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                disabled={isLoading}
                autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button type="button" onClick={() => onSetSelectionMode(selectionMode === 'destination' ? null : 'destination')} className={`p-2 rounded-full ${selectionMode === 'destination' ? 'text-white bg-purple-600' : 'text-ash'}`}><CrosshairIcon className="w-5 h-5"/></button>
            </div>
            {showDestSuggestions && destSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-obsidian border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-auto">
                {destSuggestions.map((s, i) => <li key={i} className="px-4 py-3 text-sm text-ash hover:bg-white/5 cursor-pointer" onMouseDown={() => { onDestinationChange(s); setShowDestSuggestions(false); }}>{s}</li>)}
                </ul>
            )}
          </div>
      </div>

      <div className="bg-obsidian rounded-xl p-4 border border-white/5">
        <button type="button" onClick={() => setIsPreferencesOpen(!isPreferencesOpen)} className="flex items-center justify-between w-full text-xs font-bold text-ash uppercase tracking-widest">
          <span>Trip Settings</span>
          <svg className={`w-4 h-4 transition-transform ${isPreferencesOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {isPreferencesOpen && (
          <div className="mt-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                {(['cheapest', 'balanced', 'fastest'] as const).map(p => (
                  <button key={p} type="button" onClick={() => onPreferencesChange({...preferences, priority: p})} className={`py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all ${preferences.priority === p ? 'bg-azure border-azure text-white' : 'border-white/10 text-ash hover:bg-white/5'}`}>{p}</button>
                ))}
              </div>
          </div>
        )}
      </div>
      
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-azure via-purple-600 to-coral text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
        disabled={isLoading || isLocating || !start || !destination}
      >
        {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <span>Find Routes</span>}
      </button>

      {/* Quick Action Buttons */}
      <div className="pt-2">
        <div className="flex overflow-x-auto pb-2 custom-scrollbar gap-2 no-scrollbar">
            {quickCategories.map((cat) => (
                <button
                    key={cat.label}
                    type="button"
                    onClick={() => onNearbySearch(cat.category)}
                    className="flex-shrink-0 flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 transition-all active:scale-95 group text-ash hover:text-white"
                >
                    <span className="group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>
    </form>
  );
};

export default React.memo(RouteSearchForm);
