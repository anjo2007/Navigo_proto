
import { Coordinate, TransportMode } from '../types';

// OSRM Public Demo Server
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export const TILE_LAYERS = {
  STREET: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

// Cache to prevent spamming the API
const geometryCache = new Map<string, Coordinate[]>();

export const fetchRoadGeometry = async (
  start: Coordinate, 
  end: Coordinate, 
  mode: TransportMode
): Promise<Coordinate[]> => {
  // Create a unique key for this segment
  const key = `${mode}-${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  
  if (geometryCache.has(key)) {
    return geometryCache.get(key)!;
  }

  // Map internal modes to OSRM profiles
  let profile = 'driving';
  if (mode === TransportMode.WALK) profile = 'foot';
  // Note: OSRM public demo doesn't have a specific 'bus' profile, driving is the closest approximation for geometry
  
  try {
    // OSRM expects {lon},{lat}
    const url = `${OSRM_BASE_URL}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      // OSRM returns [lon, lat], we need [lat, lon]
      const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
      
      geometryCache.set(key, coordinates);
      return coordinates;
    }
    
    return [];
  } catch (error) {
    console.warn("Failed to fetch road geometry", error);
    return []; // Fallback to straight line
  }
};
