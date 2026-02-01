
import { GoogleGenAI, Type } from '@google/genai';
import { Route, TransportMode, ChatMessage, UserPreferences, Coordinate, ScheduledOption, PlaceResult } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
      Plan 3 logical journey options from "${start}" to "${destination}".
      Account for road topology, traffic (current time: ${new Date().toLocaleTimeString('en-IN')}), and transitions.
      User context: ${travelerProfile}, Walking: ${preferences.walkingTolerance}, Priority: ${preferences.priority}.
      Avoid: ${avoidModes.join(', ') || 'None'}.

      Output a JSON array of 3 Route objects.
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
            required: ["name", "totalDurationMinutes", "segments"]
          }
        }
      },
    });
    
    const routes = JSON.parse(cleanJson(response.text || '[]'));
    
    if (Array.isArray(routes)) {
        routes.forEach((route: any) => {
             if (!route.id) route.id = Math.random().toString(36).substr(2, 9);
             onRouteReceived(route);
        });
        onComplete();
    } else {
        throw new Error("Invalid format");
    }
  } catch (error: any) {
    onError(error);
  }
};

export const searchNearbyPlaces = async (
  category: string,
  location: string
): Promise<{ results: PlaceResult[]; sources: { title: string; uri: string }[] }> => {
  try {
    const ai = getAI();
    const prompt = `Find top 5 ${category} near ${location}. Return actual business names, addresses, and ratings.`;

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
    const prompt = `Latest 5 ${mode} options from "${start}" to "${end}". JSON list.`;

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
  if (!query || query.length < 3) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    return data.features.map((feature: any) => {
        const p = feature.properties;
        const parts = [p.name, p.city, p.state].filter(part => part && typeof part === 'string');
        return [...new Set(parts)].join(', ');
    });
  } catch (error: any) { return []; }
};

export const chatWithTravelAssistant = async (
  history: ChatMessage[], 
  userMessage: string, 
  context: { start: string, destination: string, selectedRoute?: string }
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  try {
    const ai = getAI();
    const systemInstruction = `You are Navi, the Mobility Intelligence of NaviGo. Context: Trip from ${context.start} to ${context.destination}.`;

    const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: userMessage,
       config: { systemInstruction, tools: [{googleSearch: {}}] },
    });
    const text = response.text || "I'm having trouble connecting.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter(c => c.web).map(c => ({ title: c.web!.title || 'Source', uri: c.web!.uri! }));
    return { text, sources };
  } catch (error: any) {
    return { text: "Error connecting to Navi Intelligence." };
  }
};
