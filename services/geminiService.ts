
import { GoogleGenAI, Type } from "@google/genai";

export async function getLlamaAdvice(question: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${question}`,
      config: {
        systemInstruction: `You are an expert llama packer from Helena Backcountry Llamas. 
      The user is asking a question about packing, llamas, or backcountry hunting in Montana. 
      Keep it professional, outdoorsy, and encouraging.`,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 100 },
        temperature: 0.7,
      }
    });
    return response.text || "I'm sorry, I'm out grazing right now. Please try again later!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm out grazing right now. Please try again later!";
  }
}

export async function generateWelcomeSlogan(): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, punchy 1-sentence slogan for a llama rental company in Helena, Montana. Focus on the bond between human and animal in the rugged wilderness.",
      config: {
        maxOutputTokens: 50,
        thinkingConfig: { thinkingBudget: 25 },
        temperature: 1,
      }
    });
    return response.text || "Your Trusted Companion in the Montana High Country.";
  } catch {
    return "Your Trusted Companion in the Montana High Country.";
  }
}

export async function generatePackingList(tripType: string, duration: number, weather: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a detailed packing list for a ${duration}-day ${tripType} expedition. 
    The expected weather is ${weather}.
    The list must include:
    1. Essential Personal Gear
    2. Clothing (appropriate for the weather)
    3. Expedition Food Recommendations
    4. Llama-specific items (saddles, panniers, etc. are provided, but mention weight distribution)
    5. Llama Breed & Herd Recommendation: Suggest the type of llama (e.g., Classic Ccara, Suri, etc.) and the ideal temperament/animal profile needed for this specific ${duration}-day ${tripType} trip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional Montana outfitter specializing in llama packing. Keep the tone rugged, professional, and practical. Use Markdown for formatting.",
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 400 },
        temperature: 0.7,
      }
    });
    return response.text || "The trail guide is currently unavailable. Please try again later.";
  } catch (error) {
    console.error("Packing List Error:", error);
    return "The trail guide is currently unavailable. Please try again later.";
  }
}

export async function generateBackdrop(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `A stunning, high-quality landscape photograph of the Montana wilderness. ${prompt}. Realistic, natural lighting, sharp focus, 4k resolution, cinematic composition.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from model");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export interface AIScoutResponse {
  text: string;
  sources?: { title: string; uri: string }[];
}

export async function getHighCountryAdvice(query: string): Promise<AIScoutResponse> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${query}`,
      config: {
        systemInstruction: `You are the "High Country AI Scout" for Helena Backcountry Llamas. 
        Your mission is to provide real-time intelligence on trail conditions, weather, and llama packing safety in the Montana Rockies.
        Use Google Search and Maps to find the most current information.
        Focus on the Helena National Forest and surrounding high country.
        Be professional, rugged, and safety-oriented.`,
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 500 },
        temperature: 0.7,
      }
    });

    const text = response.text || "The scout is currently off-grid. Please try again later.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map(c => {
      if (c.web) return { title: c.web.title || 'Source', uri: c.web.uri };
      return null;
    }).filter(s => s !== null) as { title: string; uri: string }[];

    return { text, sources };
  } catch (error) {
    console.error("AI Scout Error:", error);
    return { text: "The scout is currently off-grid. Please try again later." };
  }
}

export async function getQuickAdvice(query: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Question: ${query}`,
      config: {
        systemInstruction: "You are a helpful assistant for Helena Backcountry Llamas. Provide a quick, concise answer to the user's question about llama packing or our services.",
        maxOutputTokens: 150,
        temperature: 0.5,
      }
    });
    return response.text || "I'm sorry, I couldn't get that information right now.";
  } catch (error) {
    console.error("Quick Advice Error:", error);
    return "I'm sorry, I couldn't get that information right now.";
  }
}
