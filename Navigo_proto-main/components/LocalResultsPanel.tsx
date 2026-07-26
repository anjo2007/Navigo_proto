
import React from 'react';
import { PlaceResult } from '../types';

interface LocalResultsPanelProps {
  category: string;
  results: PlaceResult[];
  sources: { title: string; uri: string }[];
  onClose: () => void;
  onNavigate: (place: PlaceResult) => void;
}

const LocalResultsPanel: React.FC<LocalResultsPanelProps> = ({ category, results, sources, onClose, onNavigate }) => {
  return (
    <div className="mt-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white capitalize flex items-center">
            <span className="mr-2">📍</span> {category} Near You
        </h3>
        <button onClick={onClose} className="p-2 text-ash hover:text-white bg-white/5 rounded-full">✕</button>
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
            <div className="p-10 text-center text-ash border border-dashed border-white/10 rounded-2xl">
                No results found. Try a different search area.
            </div>
        ) : (
            results.map((place) => (
                <div key={place.id} className="bg-obsidian border border-white/5 p-4 rounded-2xl transition-all hover:border-azure/40 hover:bg-white/5 group shadow-lg">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h4 className="font-bold text-white group-hover:text-azure transition-colors">{place.name}</h4>
                            <p className="text-xs text-ash mt-1 leading-relaxed">{place.address}</p>
                            {place.rating && (
                                <div className="flex items-center mt-2 space-x-1">
                                    <span className="text-xs font-bold text-yellow-500">★ {place.rating}</span>
                                    <span className="text-[10px] text-ash uppercase tracking-widest font-bold ml-2">{place.openingHours || 'Open Now'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <button 
                            onClick={() => onNavigate(place)}
                            className="flex-1 py-2 bg-azure/10 text-azure hover:bg-azure hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Get Routes
                        </button>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-white/5 text-ash hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Maps
                        </a>
                    </div>
                </div>
            ))
        )}
      </div>

      {sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-3 opacity-40">Verified via:</p>
              <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 3).map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-azure hover:underline truncate max-w-[200px] opacity-70 bg-azure/5 px-2 py-1 rounded">
                          {s.title}
                      </a>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default LocalResultsPanel;
