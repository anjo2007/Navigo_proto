import React, { useState, useEffect } from 'react';
import { Route, TransportMode, OccupancyLevel, User } from '../types';
import RouteSegment from './RouteSegment';
import OccupancyReporter from './OccupancyReporter';
import { databaseService } from '../services/databaseService';

interface JourneyViewProps {
  journey: Route;
  currentSegmentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
  user: User | null;
}

const JourneyView: React.FC<JourneyViewProps> = ({ journey, currentSegmentIndex, onNext, onPrevious, onExit, user }) => {
  const [showReporter, setShowReporter] = useState(false);
  const currentSegment = journey.segments[currentSegmentIndex];
  const totalSegments = journey.segments.length;
  const progressPercentage = ((currentSegmentIndex + 1) / totalSegments) * 100;
  
  const isBusSegment = currentSegment.mode === TransportMode.BUS;

  // Simulate Passive GPS Harvesting if user is Ambassador
  useEffect(() => {
    let interval: any;
    if (user?.isAmbassador) {
        // Mocking 1Hz GPS collection
        interval = setInterval(() => {
            console.log(`[Passive Harvest] GPS Trace collected for User ${user.id} on Route ${journey.id}`);
        }, 3000); // reduced frequency for log sanity
    }
    return () => clearInterval(interval);
  }, [user, journey]);

  // Trigger Occupancy Reporter logic
  useEffect(() => {
      if (isBusSegment && user?.role === 'contributor') {
          // Show reporter after 5 seconds of entering bus segment
          const timer = setTimeout(() => setShowReporter(true), 5000);
          return () => clearTimeout(timer);
      } else {
          setShowReporter(false);
      }
  }, [currentSegmentIndex, isBusSegment, user]);

  const handleReport = (level: OccupancyLevel) => {
      if (!user) return;
      // Logic to submit report
      databaseService.submitCrowdReport({
          userId: user.id,
          type: 'OCCUPANCY',
          level: level,
          location: currentSegment.pathCoordinates[0] || { lat: 0, lng: 0 }
      });
      setShowReporter(false);
      // Could show toast here
  };

  return (
    <div className="p-5 glass-panel rounded-2xl shadow-2xl animate-fade-in relative overflow-hidden">
      {/* Active Route Background Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon to-azure"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Current Trip
          </h2>
          <div className="flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
               <p className="text-xs text-azure font-mono">LIVE GUIDANCE</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors border border-white/10"
        >
          End
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-ash mb-1 uppercase tracking-wider font-semibold">
          <span>Step {currentSegmentIndex + 1}/{totalSegments}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-neon to-azure h-1 rounded-full transition-all duration-500 shadow-[0_0_10px_#2979FF]"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Current Segment */}
      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
        <RouteSegment segment={currentSegment} />
      </div>

      {/* Navigation Controls */}
      <div className="flex space-x-3 mt-4">
        <button
          onClick={onPrevious}
          disabled={currentSegmentIndex === 0}
          className="flex-1 bg-white/5 hover:bg-white/10 text-ash hover:text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/5"
        >
          Prev
        </button>
        {currentSegmentIndex === totalSegments - 1 ? (
          <button
            onClick={onExit}
            className="flex-1 bg-neon text-void font-bold py-3 rounded-xl hover:bg-green-400 transition-colors shadow-lg"
          >
            Arrive
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 bg-azure text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
          >
            Next Leg
          </button>
        )}
      </div>

      {/* Active Reporter Overlay */}
      {showReporter && (
          <OccupancyReporter onSubmit={handleReport} onClose={() => setShowReporter(false)} />
      )}
    </div>
  );
};

export default JourneyView;