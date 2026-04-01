import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIScoutResponse {
  text: string;
  sources?: { title: string; uri: string }[];
}

export async function getHighCountryAdvice(prompt: string, location?: { lat: number; lng: number }): Promise<AIScoutResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are the 'High Country AI Scout' for Helena Backcountry Llamas. You provide expert advice on Montana trails, weather, and llama packing safety. Use Google Search and Maps to provide real-time, accurate information. Always prioritize safety and local knowledge.",
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ],
        toolConfig: {
          includeServerSideToolInvocations: true,
          retrievalConfig: {
            latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined
          }
        }
      },
    });

    const text = response.text || "I'm having trouble scouting the high country right now. Please try again in a moment.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map(chunk => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
      return null;
    }).filter((s): s is { title: string; uri: string } => s !== null);

    return { text, sources };
  } catch (error) {
    console.error("AI Scout Error:", error);
    return { text: "The high country is currently unreachable. Please check back soon." };
  }
}

export async function getQuickAdvice(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant for Helena Backcountry Llamas. Provide quick, concise answers about our services and llamas.",
      },
    });
    return response.text || "I'm here to help! What can I tell you about our llamas?";
  } catch (error) {
    console.error("Quick Advice Error:", error);
    return "I'm experiencing a slight delay. How can I help you today?";
  }
}
