import { GoogleGenAI } from "@google/genai";

export async function getLlamaAdvice(question: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert llama packer from Helena Backcountry Llamas. 
      The user is asking a question about packing, llamas, or backcountry hunting in Montana. 
      Keep it professional, outdoorsy, and encouraging. 
      Question: ${question}`,
      config: {
        maxOutputTokens: 200,
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
        maxOutputTokens: 50,
        temperature: 1,
      }
    });
    return response.text || "The Ultimate Montana Backcountry Partner.";
  } catch {
    return "The Ultimate Montana Backcountry Partner.";
  }
}

export async function generateBackdrop(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `A stunning, high-quality landscape photograph of the Montana wilderness. ${prompt}. Realistic, natural lighting, sharp focus, 4k resolution, cinematic composition.`;
    
    // Upgraded to gemini-3-pro-image-preview for high-quality generation
    // and enabled googleSearch to ground the visual features in reality.
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