import { GoogleGenAI, Type } from '@google/genai';
import { Route, TransportMode, ChatMessage, UserPreferences, ScheduledOption, PlaceResult } from '../types';

// State-of-the-Art Model Chain (Gemini 2.5 Flash as primary, with 2.0-flash, 1.5-flash, 2.5-pro fallbacks)
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

export const getStoredGeminiKey = (): string | null => {
  try {
    const key = localStorage.getItem('navigo_gemini_key');
    if (key && key.trim()) return key.trim();
  } catch (e) {
    // Ignore localStorage access errors
  }
  return ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || null;
};

export const saveGeminiKey = (key: string): void => {
  try {
    localStorage.setItem('navigo_gemini_key', key.trim());
  } catch (e) {
    console.error("Failed to save Gemini API key", e);
  }
};

export const hasGeminiKey = (): boolean => {
  const key = getStoredGeminiKey();
  return !!key && key.length >= 10;
};

const getAI = () => {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) {
    throw new Error("GEMINI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJson = (text: string): string => {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  cleaned = cleaned.trim();
  return cleaned;
};

// Resilient multi-tier model execution wrapper
const generateContentWithFallback = async (params: {
  contents: string | any;
  config?: any;
}) => {
  const ai = getAI();
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        ...params
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed, attempting next in chain...`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All AI models in fallback chain failed.");
};

// Zero-cost memory cache for route searches
const routeCache = new Map<string, Route[]>();

const generateFallbackSchedules = (mode: TransportMode, start: string, end: string): ScheduledOption[] => {
  const currentHour = new Date().getHours();
  return [
    {
      id: 'sched-fb-1',
      name: `${mode === TransportMode.BUS ? 'Express Bus' : 'Superfast Express'} #${100 + Math.floor(Math.random() * 50)}`,
      startTime: `${(currentHour + 1) % 24}:15`,
      startLocation: start,
      endTime: `${(currentHour + 2) % 24}:45`,
      endLocation: end,
      priceINR: mode === TransportMode.BUS ? 45 : 120,
      operator: 'State Transit Board',
      occupancyHint: 'LOW'
    },
    {
      id: 'sched-fb-2',
      name: `${mode === TransportMode.BUS ? 'City Limited Bus' : 'Intercity Rapid'} #${200 + Math.floor(Math.random() * 50)}`,
      startTime: `${(currentHour + 2) % 24}:30`,
      startLocation: start,
      endTime: `${(currentHour + 4) % 24}:00`,
      endLocation: end,
      priceINR: mode === TransportMode.BUS ? 65 : 160,
      operator: 'Metro Transport',
      occupancyHint: 'MODERATE'
    },
    {
      id: 'sched-fb-3',
      name: `${mode === TransportMode.BUS ? 'Comfort Shuttle' : 'Passenger Local'} #${300 + Math.floor(Math.random() * 50)}`,
      startTime: `${(currentHour + 3) % 24}:45`,
      startLocation: start,
      endTime: `${(currentHour + 5) % 24}:15`,
      endLocation: end,
      priceINR: mode === TransportMode.BUS ? 35 : 90,
      operator: 'Regional Commuter Line',
      occupancyHint: 'HIGH'
    }
  ];
};

const generateFallbackPlaces = (category: string, location: string): PlaceResult[] => {
  return [
    {
      id: 'place-fb-1',
      name: `Central ${category} Hub`,
      address: `Main Station Road, ${location}`,
      rating: 4.8,
      category: category,
      phoneNumber: '+91 98765 43210',
      openingHours: 'Open 24 Hours'
    },
    {
      id: 'place-fb-2',
      name: `City ${category} Center`,
      address: `Plaza Junction, ${location}`,
      rating: 4.6,
      category: category,
      phoneNumber: '+91 98765 12345',
      openingHours: '6:00 AM - 10:00 PM'
    },
    {
      id: 'place-fb-3',
      name: `Express ${category} Point`,
      address: `Highway Boulevard, ${location}`,
      rating: 4.7,
      category: category,
      phoneNumber: '+91 98765 67890',
      openingHours: '7:00 AM - 11:00 PM'
    }
  ];
};

export const streamRoutes = async (
  start: string, 
  destination: string, 
  travelerProfile: string, 
  avoidModes: TransportMode[],
  preferences: UserPreferences,
  onRouteReceived: (route: Route) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  const cacheKey = `${start.trim().toLowerCase()}_to_${destination.trim().toLowerCase()}_${avoidModes.sort().join('_')}_${preferences.priority}`;
  if (routeCache.has(cacheKey)) {
    const cachedRoutes = routeCache.get(cacheKey)!;
    cachedRoutes.forEach(r => onRouteReceived(r));
    onComplete();
    return;
  }

  try {
    const prompt = `
      You are Navigo's AI Mobility Engine (Powered by Gemini 2.5 Flash).
      Synthesize 3 highly accurate, realistic multi-modal journey options from "${start}" to "${destination}".
      
      User Parameters:
      - Profile: ${travelerProfile}
      - Walking Preference: ${preferences.walkingTolerance} tolerance
      - Priority: ${preferences.priority}
      - Excluded Modes: ${avoidModes.join(', ') || 'None'}
      
      Requirements:
      1. Category 1: "TIME_EFFICIENT" (Fastest express route).
      2. Category 2: "BUDGET_FRIENDLY" (Cheapest route).
      3. Category 3: "BALANCED" (Optimal blend of speed and cost).
      
      For each route:
      - Compute estimated CO₂ saved in Kilograms (co2SavedKg) compared to solo petrol driving.
      - Assign an ecoScore ("A+", "A", or "B").
      - For each segment include mode, start/end locations, duration, cost in INR, bus/train number if applicable, and pathCoordinates (min 2 points).
      
      Output ONLY a valid JSON array of 3 Route objects matching the response schema.
    `;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["TIME_EFFICIENT", "BUDGET_FRIENDLY", "BALANCED"] },
              totalDurationMinutes: { type: Type.NUMBER },
              totalCostINR: { type: Type.NUMBER },
              co2SavedKg: { type: Type.NUMBER },
              ecoScore: { type: Type.STRING },
              modeSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING },
                    start: { type: Type.STRING },
                    end: { type: Type.STRING },
                    durationMinutes: { type: Type.NUMBER },
                    costINR: { type: Type.NUMBER },
                    details: { type: Type.STRING },
                    busNumber: { type: Type.STRING },
                    pathCoordinates: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } }
                      }
                    }
                  }
                }
              }
            },
            required: ["name", "totalDurationMinutes", "segments", "category"]
          }
        }
      }
    });
    
    const routes = JSON.parse(cleanJson(response.text || '[]'));
    
    if (Array.isArray(routes) && routes.length > 0) {
      routes.forEach((route: any) => {
        if (!route.id) route.id = Math.random().toString(36).substr(2, 9);
        if (!route.co2SavedKg) route.co2SavedKg = Math.round((route.totalDurationMinutes * 0.08) * 10) / 10;
        if (!route.ecoScore) route.ecoScore = 'A+';
        onRouteReceived(route);
      });
      routeCache.set(cacheKey, routes);
      onComplete();
    } else {
      throw new Error("Invalid response format from Gemini engine.");
    }
  } catch (error: any) {
    console.error("Gemini route optimization error:", error);
    onError(error);
  }
};

export const searchNearbyPlaces = async (
  category: string,
  location: string
): Promise<{ results: PlaceResult[]; sources: { title: string; uri: string }[] }> => {
  try {
    const prompt = `Find top 5 highly-rated ${category} near ${location}. Return real business names, addresses, ratings, and phone numbers in JSON format.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              category: { type: Type.STRING },
              phoneNumber: { type: Type.STRING },
              openingHours: { type: Type.STRING }
            },
            required: ["name", "address"]
          }
        }
      }
    });

    const parsed = JSON.parse(cleanJson(response.text || '[]'));
    const results = Array.isArray(parsed) && parsed.length > 0 ? parsed : generateFallbackPlaces(category, location);

    return { 
      results: results.map((r: any) => ({ ...r, id: r.id || Math.random().toString(36).substr(2, 9) })), 
      sources: [] 
    };
  } catch (e) {
    console.error("Place search failed:", e);
    return { results: generateFallbackPlaces(category, location), sources: [] };
  }
};

export const getRealtimeSchedules = async (
  mode: TransportMode,
  start: string,
  end: string
): Promise<{ options: ScheduledOption[]; sources: { title: string; uri: string }[] }> => {
  try {
    const prompt = `Provide 5 realistic, accurate upcoming ${mode} service schedules operating between "${start}" and "${end}". Include operator name, vehicle/bus/train number, departure time, arrival time, cost in INR, and current estimated occupancy.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              startTime: { type: Type.STRING },
              startLocation: { type: Type.STRING },
              endTime: { type: Type.STRING },
              endLocation: { type: Type.STRING },
              priceINR: { type: Type.NUMBER },
              operator: { type: Type.STRING },
              occupancyHint: { type: Type.STRING }
            }
          }
        }
      }
    });

    let rawOptions = JSON.parse(cleanJson(response.text || '[]'));
    let options: ScheduledOption[] = [];

    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      options = rawOptions.map((opt: any, index: number) => ({
        id: opt.id || `sched-${index}-${Date.now()}`,
        name: opt.name || `${mode.toUpperCase()} Express #${100 + index}`,
        startTime: opt.startTime || `${8 + index * 2}:15 AM`,
        startLocation: opt.startLocation || start,
        endTime: opt.endTime || `${9 + index * 2}:45 AM`,
        endLocation: opt.endLocation || end,
        priceINR: typeof opt.priceINR === 'number' ? opt.priceINR : Math.floor(Math.random() * 80 + 20),
        operator: opt.operator || 'State Transport Line',
        occupancyHint: opt.occupancyHint || (index % 2 === 0 ? 'MODERATE' : 'LOW')
      }));
    } else {
      options = generateFallbackSchedules(mode, start, end);
    }

    return { options, sources: [] };
  } catch (e) {
    console.warn("Realtime schedules lookup error, using synthesized schedules:", e);
    return { options: generateFallbackSchedules(mode, start, end), sources: [] };
  }
};

export const getPlaceSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    return data.features.map((feature: any) => {
      const p = feature.properties;
      const parts = [p.name, p.city, p.state, p.country].filter(part => part && typeof part === 'string');
      return [...new Set(parts)].join(', ');
    });
  } catch (error: any) { 
    return []; 
  }
};

export const chatWithTravelAssistant = async (
  history: ChatMessage[], 
  userMessage: string, 
  context: { start: string, destination: string, selectedRoute?: string }
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  try {
    const systemInstruction = `You are Navi, the high-performance Mobility Intelligence of Navigo (Powered by Gemini 2.5 Flash). 
    Context: Commuter journey from "${context.start || 'current location'}" to "${context.destination || 'destination'}".
    Provide crisp, highly actionable, eco-friendly transit advice.`;

    const response = await generateContentWithFallback({
       contents: userMessage,
       config: { systemInstruction, tools: [{googleSearch: {}}] },
    });
    const text = response.text || "I'm having trouble connecting to Navi Intelligence.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web).map(c => ({ title: c.web!.title || 'Source', uri: c.web!.uri! }));
    return { text, sources };
  } catch (error: any) {
    if (error?.message === "GEMINI_KEY_MISSING") {
      return { text: "Please configure your Gemini API Key to activate Navi Assistant." };
    }
    return { text: "Error connecting to Navi Intelligence. Please check your API key." };
  }
};
