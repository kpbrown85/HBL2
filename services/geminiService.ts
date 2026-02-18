
import { GoogleGenAI } from "@google/genai";

export async function getLlamaAdvice(question: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${question}`,
      config: {
        // Use systemInstruction for better persona control
        systemInstruction: `You are an expert llama packer from Helena Backcountry Llamas. 
      The user is asking a question about packing, llamas, or backcountry hunting in Montana. 
      Keep it professional, outdoorsy, and encouraging.`,
        // When setting maxOutputTokens, thinkingConfig: { thinkingBudget } must also be set
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
      contents: "Generate a short, punchy 1-sentence slogan for a llama rental company in Helena, Montana that specializes in backcountry backpacking and hunting.",
      config: {
        // When setting maxOutputTokens, thinkingConfig: { thinkingBudget } must also be set
        maxOutputTokens: 50,
        thinkingConfig: { thinkingBudget: 25 },
        temperature: 1,
      }
    });
    return response.text || "The Ultimate Montana Backcountry Partner.";
  } catch {
    return "The Ultimate Montana Backcountry Partner.";
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
    4. Llama-specific items (saddles, panniers, etc. are provided, but mention weight distribution)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // Use systemInstruction for outfitter persona
        systemInstruction: "You are a professional Montana outfitter specializing in llama packing. Keep the tone rugged, professional, and practical. Use Markdown for formatting.",
        // When setting maxOutputTokens, thinkingConfig: { thinkingBudget } must also be set
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 400 },
        temperature: 0.7,
      }
    });
    return response.text || "Unable to generate list at base camp. Please check back later.";
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
        // Use google_search (snake_case) for image generation models like gemini-3-pro-image-preview
        tools: [{ google_search: {} }]
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
