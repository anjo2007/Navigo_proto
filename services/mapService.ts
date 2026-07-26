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

// Cache to prevent spamming the OSRM API
const geometryCache = new Map<string, Coordinate[]>();

// Utility: High-precision interpolation between coordinates
export const interpolateCoordinates = (start: Coordinate, end: Coordinate, steps = 10): Coordinate[] => {
  const points: Coordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    points.push({
      lat: start.lat + (end.lat - start.lat) * factor,
      lng: start.lng + (end.lng - start.lng) * factor
    });
  }
  return points;
};

export const fetchRoadGeometry = async (
  start: Coordinate, 
  end: Coordinate, 
  mode: TransportMode
): Promise<Coordinate[]> => {
  if (!start || !end || isNaN(start.lat) || isNaN(end.lat)) return [];

  // Create a unique key for caching
  const key = `${mode}-${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  
  if (geometryCache.has(key)) {
    return geometryCache.get(key)!;
  }

  // Select profile
  let profile = 'driving';
  if (mode === TransportMode.WALK) profile = 'foot';

  try {
    const url = `${OSRM_BASE_URL}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coordinates: Coordinate[] = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        
        geometryCache.set(key, coordinates);
        return coordinates;
      }
    }
  } catch (error) {
    console.warn("OSRM road geometry fallback to interpolated curve:", error);
  }

  // Graceful fallback: Interpolate intermediate nodes for smooth map polyline
  const fallbackCoords = interpolateCoordinates(start, end, 8);
  geometryCache.set(key, fallbackCoords);
  return fallbackCoords;
};
