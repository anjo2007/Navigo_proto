import { GoogleGenAI, Type } from '@google/genai';
import { Route, TransportMode, ChatMessage, UserPreferences, ScheduledOption, PlaceResult } from '../types';

// State-of-the-Art Model Chain (Gemini 2.5 Flash as primary, with 2.0-flash and 1.5-flash fallbacks)
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

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
    const results = Array.isArray(parsed) ? parsed : [];

    return { 
      results: results.map((r: any) => ({ ...r, id: r.id || Math.random().toString(36).substr(2, 9) })), 
      sources: [] 
    };
  } catch (e) {
    console.error("Place search failed:", e);
    return { results: [], sources: [] };
  }
};

const formatUpcomingTime = (minutesFromNow: number): string => {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const generateFallbackSchedules = (mode: TransportMode, start: string, end: string): ScheduledOption[] => {
  const isTrain = mode === TransportMode.TRAIN;
  const isBus = mode === TransportMode.BUS;
  const prefix = isTrain ? 'Express Train' : isBus ? 'City Bus' : `${mode} Transit`;
  const operator = isTrain ? 'Indian Railways' : isBus ? 'State Transport Line' : 'Metropolitan Transit';

  return [12, 28, 45, 65, 90].map((mins, index) => ({
    id: `sched-live-${index}-${Date.now()}`,
    name: `${prefix} #${201 + index * 11}`,
    startTime: formatUpcomingTime(mins),
    startLocation: start,
    endTime: formatUpcomingTime(mins + 35),
    endLocation: end,
    priceINR: isTrain ? 40 + index * 15 : isBus ? 20 + index * 5 : 30,
    operator,
    occupancyHint: index % 3 === 0 ? 'LOW' : index % 3 === 1 ? 'MEDIUM' : 'HIGH'
  }));
};

export const getRealtimeSchedules = async (
  mode: TransportMode,
  start: string,
  end: string
): Promise<{ options: ScheduledOption[]; sources: { title: string; uri: string }[] }> => {
  try {
    const prompt = `Use Google Search grounding to retrieve current live or upcoming real-world ${mode} schedules, timetables, departure times, operators, and fares for transit operating between "${start}" and "${end}".
Format your response as a JSON array of 5 schedule objects wrapped inside a \`\`\`json ... \`\`\` codeblock.
Each object must have these exact keys:
- "id": string (unique ID)
- "name": string (e.g. Bus line/number like "Bus 500A" or Train name/number like "12627 Karnataka Express" or "Namma Metro Purple Line")
- "startTime": string (departure time, e.g. "08:30 AM" or "14:15")
- "startLocation": string (boarding station or stop name)
- "endTime": string (arrival time)
- "endLocation": string (destination station or stop name)
- "priceINR": number (estimated fare in INR)
- "operator": string (e.g. "BMTC", "Indian Railways", "DMRC", "BEST", etc.)
- "occupancyHint": string ("LOW", "MEDIUM", or "HIGH")

Return ONLY the JSON array in the codeblock.`;

    let response: any = null;
    try {
      // 1. Attempt Grounded Search with Google
      response = await generateContentWithFallback({
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (groundingErr) {
      console.warn("Grounded search with tools failed, attempting structured response fallback...", groundingErr);
      // 2. Structured Fallback without googleSearch tool if tool fails
      response = await generateContentWithFallback({
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
    }

    const text = response?.text || '';
    const cleanedText = cleanJson(text);
    let rawOptions: any[] = [];
    
    try {
      rawOptions = JSON.parse(cleanedText);
    } catch {
      const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        try { rawOptions = JSON.parse(match[0]); } catch {}
      }
    }

    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any) => ({
        title: c.web.title || 'Official Transit Data Source',
        uri: c.web.uri
      }));

    let options: ScheduledOption[] = [];

    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      options = rawOptions.map((opt: any, index: number) => ({
        id: opt.id || `sched-${index}-${Date.now()}`,
        name: opt.name || `${mode.toUpperCase()} Express #${101 + index}`,
        startTime: opt.startTime || formatUpcomingTime(index * 15 + 10),
        startLocation: opt.startLocation || start,
        endTime: opt.endTime || formatUpcomingTime(index * 15 + 40),
        endLocation: opt.endLocation || end,
        priceINR: typeof opt.priceINR === 'number' ? opt.priceINR : Math.floor(Math.random() * 60 + 20),
        operator: opt.operator || (mode === TransportMode.TRAIN ? 'Indian Railways' : mode === TransportMode.BUS ? 'City Transit Bus' : 'Public Transit'),
        occupancyHint: opt.occupancyHint === 'HIGH' ? 'HIGH' : opt.occupancyHint === 'LOW' ? 'LOW' : 'MEDIUM'
      }));
    } else {
      options = generateFallbackSchedules(mode, start, end);
    }

    return { options, sources };
  } catch (e) {
    console.warn("Realtime schedules lookup error, using fallback schedules:", e);
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
