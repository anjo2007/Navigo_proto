import { GoogleGenAI, Type } from '@google/genai';
import { Route, TransportMode, ChatMessage, UserPreferences, ScheduledOption, PlaceResult } from '../types';

export const getStoredGeminiKey = (): string | null => {
  try {
    const key = localStorage.getItem('navigo_gemini_key');
    if (key && key.trim()) return key.trim();
  } catch (e) {
    // Ignore localStorage access errors
  }
  // Fallback to Vite env var if provided
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
  try {
    const ai = getAI();
    
    const prompt = `
      You are an expert multi-modal urban transit route optimizer.
      Generate 3 highly logical, realistic, and distinct journey options from "${start}" to "${destination}".
      
      User Preferences & Profile:
      - Traveler Profile: ${travelerProfile}
      - Walking Preference: ${preferences.walkingTolerance} tolerance
      - Journey Priority: ${preferences.priority}
      - Modes to Exclude: ${avoidModes.join(', ') || 'None'}
      
      Requirements for accuracy:
      1. Category 1 MUST be "TIME_EFFICIENT" (fastest, combining express transit / cabs).
      2. Category 2 MUST be "BUDGET_FRIENDLY" (cheapest, prioritizing public bus / train / walk).
      3. Category 3 MUST be "BALANCED" (optimal trade-off between time, cost, and convenience).
      
      For each segment in a route:
      - Include exact mode: WALK, BUS, TRAIN, AUTO, TAXI, or FERRY.
      - Provide real route/bus numbers if applicable (e.g. "Bus 500A", "Blue Line Metro").
      - Provide detailed, turn-by-turn or boarding instructions in the "details" string.
      - Provide estimated pathCoordinates with at least 2 coordinate points per segment.
      
      Output ONLY a JSON array of 3 Route objects matching the requested schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      },
    });
    
    const routes = JSON.parse(cleanJson(response.text || '[]'));
    
    if (Array.isArray(routes) && routes.length > 0) {
      routes.forEach((route: any) => {
        if (!route.id) route.id = Math.random().toString(36).substr(2, 9);
        onRouteReceived(route);
      });
      onComplete();
    } else {
      throw new Error("Invalid route format returned from AI.");
    }
  } catch (error: any) {
    console.error("Route generation error:", error);
    onError(error);
  }
};

export const searchNearbyPlaces = async (
  category: string,
  location: string
): Promise<{ results: PlaceResult[]; sources: { title: string; uri: string }[] }> => {
  try {
    const ai = getAI();
    const prompt = `Find top 5 highly-rated ${category} near ${location}. Return actual business/place names, real addresses, ratings, and phone numbers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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

    const results = JSON.parse(cleanJson(response.text || '[]'));
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web).map(c => ({ 
      title: c.web!.title || 'Information Source', 
      uri: c.web!.uri! 
    }));

    return { 
      results: results.map((r: any) => ({ ...r, id: r.id || Math.random().toString(36).substr(2, 9) })), 
      sources 
    };
  } catch (e) {
    console.error("Place search failed:", e);
    return { results: [], sources: [] };
  }
};

export const getRealtimeSchedules = async (
  mode: TransportMode,
  start: string,
  end: string
): Promise<{ options: ScheduledOption[]; sources: { title: string; uri: string }[] }> => {
  try {
    const ai = getAI();
    const prompt = `Provide the latest 5 realistic ${mode} options from "${start}" to "${end}". Include exact departure/arrival times, operator name, price in INR, and occupancy status.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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

    const options = JSON.parse(cleanJson(response.text || '[]'));
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web).map(c => ({ title: c.web!.title || 'Transit Source', uri: c.web!.uri! }));

    return { options, sources };
  } catch (e) {
    return { options: [], sources: [] };
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
    const ai = getAI();
    const systemInstruction = `You are Navi, the high-intelligence urban mobility assistant of Navigo. 
    Context: Trip from "${context.start || 'current location'}" to "${context.destination || 'target location'}".
    Be helpful, direct, accurate, and concise. Provide actionable advice for commuters.`;

    const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: userMessage,
       config: { systemInstruction, tools: [{googleSearch: {}}] },
    });
    const text = response.text || "I'm having trouble connecting to Navi Intelligence.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web).map(c => ({ title: c.web!.title || 'Source', uri: c.web!.uri! }));
    return { text, sources };
  } catch (error: any) {
    if (error?.message === "GEMINI_KEY_MISSING") {
      return { text: "Please enter your Gemini API Key to enable Navi AI Assistant." };
    }
    return { text: "Error connecting to Navi Intelligence. Please check your API key." };
  }
};
