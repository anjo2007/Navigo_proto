
import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Route, Coordinate, TransportMode } from '../types';
import L from 'leaflet';
import StartMarkerIcon from './icons/StartMarkerIcon';
import EndMarkerIcon from './icons/EndMarkerIcon';
import SatelliteIcon from './icons/SatelliteIcon';
import MapIcon from './icons/MapIcon';
import PlusIcon from './icons/PlusIcon';
import MinusIcon from './icons/MinusIcon';
import { fetchRoadGeometry, TILE_LAYERS } from '../services/mapService';

type LatLngExpression = [number, number];

interface MapViewProps {
  routes: Route[];
  expandedRouteId: string | null;
  hoveredRouteId: string | null;
  activeJourney: Route | null;
  currentSegmentIndex: number;
  onRouteSelect: (id: string) => void;
  selectionMode: boolean;
  onMapClick: (coords: Coordinate) => void;
  inputStartCoord: Coordinate | null;
  inputEndCoord: Coordinate | null;
}

const COLORS = {
  BALANCED: '#2979FF', 
  TIME_EFFICIENT: '#00E676', 
  BUDGET_FRIENDLY: '#FFB300', 
  DEFAULT: '#424242', 
  HOVER: '#FFFFFF', 
  ACTIVE_SEGMENT: '#00E676', 
};

const createMarker = (Icon: React.FC) => L.divIcon({
  html: renderToStaticMarkup(<Icon />),
  className: 'custom-map-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const MapView: React.FC<MapViewProps> = ({ 
  routes, 
  expandedRouteId, 
  hoveredRouteId, 
  activeJourney, 
  currentSegmentIndex, 
  onRouteSelect, 
  selectionMode, 
  onMapClick,
  inputStartCoord,
  inputEndCoord
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [detailedGeometries, setDetailedGeometries] = useState<Record<string, Coordinate[]>>({});
  const fetchedSegmentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { center: [20.5, 78.9], zoom: 5, zoomControl: false });
      L.tileLayer(TILE_LAYERS.STREET.url, { attribution: TILE_LAYERS.STREET.attribution }).addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.eachLayer(l => { if (l instanceof L.TileLayer) l.setUrl(isSatellite ? TILE_LAYERS.SATELLITE.url : TILE_LAYERS.STREET.url); });
  }, [isSatellite]);

  useEffect(() => {
    const fetchGeometry = async (route: Route) => {
        const newGeoms: Record<string, Coordinate[]> = {};
        for (let i = 0; i < route.segments.length; i++) {
            const k = `${route.id}_${i}`;
            if (fetchedSegmentsRef.current.has(k)) continue;
            const seg = route.segments[i];
            if (seg.pathCoordinates?.length >= 2 && seg.mode !== TransportMode.WALK) {
                fetchedSegmentsRef.current.add(k);
                const path = await fetchRoadGeometry(seg.pathCoordinates[0], seg.pathCoordinates[seg.pathCoordinates.length-1], seg.mode);
                if (path.length > 0) newGeoms[k] = path;
            }
        }
        if (Object.keys(newGeoms).length > 0) setDetailedGeometries(p => ({ ...p, ...newGeoms }));
    };
    if (activeJourney) fetchGeometry(activeJourney); else if (expandedRouteId) {
        const r = routes.find(r => r.id === expandedRouteId);
        if (r) fetchGeometry(r);
    }
  }, [expandedRouteId, activeJourney, routes]);

  useEffect(() => {
    const polylineLayer = polylineLayerRef.current;
    const markerLayer = markerLayerRef.current;
    const map = mapInstanceRef.current;
    if (!polylineLayer || !markerLayer || !map) return;

    polylineLayer.clearLayers();
    markerLayer.clearLayers();

    const targets = activeJourney ? [activeJourney] : routes;
    targets.forEach(route => {
      const isExpanded = route.id === expandedRouteId;
      const isHovered = route.id === hoveredRouteId;
      const isActive = activeJourney?.id === route.id;
      
      route.segments.forEach((seg, idx) => {
        const k = `${route.id}_${idx}`;
        const coords = detailedGeometries[k] || seg.pathCoordinates || [];
        if (coords.length < 2) return;

        const poly = L.polyline(coords.map(c => [c.lat, c.lng] as LatLngExpression), {
            color: isActive ? (idx === currentSegmentIndex ? COLORS.ACTIVE_SEGMENT : '#424242') : (isHovered ? COLORS.HOVER : (COLORS[route.category] || COLORS.DEFAULT)),
            weight: (isExpanded || isHovered || (isActive && idx === currentSegmentIndex)) ? 6 : 4,
            opacity: isActive ? (idx === currentSegmentIndex ? 1 : 0.3) : (expandedRouteId ? (isExpanded ? 0.9 : 0.2) : 0.7),
            dashArray: seg.mode === TransportMode.WALK ? '4, 8' : undefined
        });

        if (!isActive) poly.on('click', () => onRouteSelect(route.id));
        poly.addTo(polylineLayer);
      });

      if (isExpanded || isActive) {
          const s = route.segments[0].pathCoordinates?.[0];
          const e = route.segments[route.segments.length-1].pathCoordinates?.slice(-1)[0];
          if (s) L.marker([s.lat, s.lng], { icon: createMarker(StartMarkerIcon) }).addTo(markerLayer);
          if (e) L.marker([e.lat, e.lng], { icon: createMarker(EndMarkerIcon) }).addTo(markerLayer);
      }
    });

    if (inputStartCoord && !activeJourney) L.marker([inputStartCoord.lat, inputStartCoord.lng], { icon: createMarker(StartMarkerIcon), opacity: 0.6 }).addTo(markerLayer);
    if (inputEndCoord && !activeJourney) L.marker([inputEndCoord.lat, inputEndCoord.lng], { icon: createMarker(EndMarkerIcon), opacity: 0.6 }).addTo(markerLayer);

  }, [routes, expandedRouteId, hoveredRouteId, activeJourney, currentSegmentIndex, detailedGeometries, inputStartCoord, inputEndCoord]);

  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const allPoints: LatLngExpression[] = [];
      const filter = activeJourney ? [activeJourney] : (expandedRouteId ? routes.filter(r => r.id === expandedRouteId) : routes);
      filter.forEach(r => r.segments.forEach((s, i) => (detailedGeometries[`${r.id}_${i}`] || s.pathCoordinates || []).forEach(c => allPoints.push([c.lat, c.lng]))));
      if (allPoints.length > 0) map.flyToBounds(L.latLngBounds(allPoints), { padding: [60, 60], duration: 1.5 });
  }, [routes, expandedRouteId, activeJourney, currentSegmentIndex]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute top-20 right-6 z-[1000] flex flex-col space-y-4">
          <button onClick={() => setIsSatellite(!isSatellite)} className="p-3 bg-obsidian/90 backdrop-blur-md rounded-2xl border border-white/10 text-mist shadow-2xl hover:bg-obsidian">
              {isSatellite ? <MapIcon className="w-6 h-6" /> : <SatelliteIcon className="w-6 h-6" />}
          </button>
      </div>
      <div className="absolute bottom-32 right-6 z-[1000] flex flex-col space-y-2">
          <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-3 bg-obsidian/90 backdrop-blur-md rounded-xl border border-white/10 text-mist shadow-lg"><PlusIcon className="w-5 h-5" /></button>
          <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-3 bg-obsidian/90 backdrop-blur-md rounded-xl border border-white/10 text-mist shadow-lg"><MinusIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default React.memo(MapView);
