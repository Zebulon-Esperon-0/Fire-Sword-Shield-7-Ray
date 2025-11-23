import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';

export const getAiClient = (key?: string) => new GoogleGenAI({ apiKey: key || apiKey });

// Helper for Key Selection (Veo/Pro Image)
export const ensurePaidKey = async (): Promise<string> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    try {
        if (!await (window as any).aistudio.hasSelectedApiKey()) {
            await (window as any).aistudio.openSelectKey();
        }
        return process.env.API_KEY || apiKey;
    } catch (e) {
        console.warn("AI Studio bridge failed, falling back to env key", e);
    }
  }
  return apiKey;
};

// --- TEXT & CHAT ---

export const generateAIResponse = async (
  prompt: string, 
  history: string[] = [], 
  mediaParts: any[] = [],
  config: {
      mode?: 'fast' | 'think' | 'grounding' | 'pro';
      tools?: ('search' | 'maps')[];
  } = {}
): Promise<string> => {
  const ai = getAiClient();
  
  let model = 'gemini-3-pro-preview'; // Default to Pro for general smarts
  let genConfig: any = {};
  let tools: any[] = [];

  if (config.mode === 'fast') {
    model = 'gemini-2.5-flash-lite';
  } else if (config.mode === 'think') {
    model = 'gemini-3-pro-preview';
    genConfig.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (config.tools?.includes('search')) {
      model = 'gemini-2.5-flash'; // Search works well with Flash
      tools.push({ googleSearch: {} });
  }
  if (config.tools?.includes('maps')) {
      model = 'gemini-2.5-flash';
      tools.push({ googleMaps: {} });
  }

  // If analyzing complex media, use Pro
  if (mediaParts.length > 0) {
    model = 'gemini-3-pro-preview'; 
  }

  try {
    const contents: any = {
      parts: [
        ...history.map(h => ({ text: h })),
        ...mediaParts,
        { text: prompt }
      ]
    };

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        ...genConfig,
        tools: tools.length > 0 ? tools : undefined
      }
    });

    let text = response.text || '';

    // Handle Grounding
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        let groundingText = "\n\n**Sources:**\n";
        chunks.forEach((c: any) => {
            if (c.web?.uri) groundingText += `- [${c.web.title || 'Link'}](${c.web.uri})\n`;
            if (c.maps?.uri) groundingText += `- [Map: ${c.maps.title || 'Location'}](${c.maps.uri})\n`;
        });
        text += groundingText;
    }

    return text || "No response generated.";
  } catch (e) {
    console.error("Gemini Error", e);
    return "I encountered an error consulting the archives. Please try again.";
  }
};

// --- IMAGE GENERATION (Pro) ---

export const generateImage = async (
    prompt: string, 
    size: string = '1K', 
    aspectRatio: string = '1:1'
): Promise<string[]> => {
  await ensurePaidKey();
  const ai = getAiClient(); 
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  const images: string[] = [];
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      images.push(`data:image/png;base64,${part.inlineData.data}`);
    }
  }
  return images;
};

// --- IMAGE EDITING (Flash Image) ---

export const editImage = async (prompt: string, base64Image: string): Promise<string | null> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// --- VIDEO GENERATION (Veo) ---

export const generateVeoVideo = async (
    prompt: string, 
    aspectRatio: string = '16:9',
    imageBytes?: string
): Promise<string | null> => {
  await ensurePaidKey();
  const ai = getAiClient();

  const config: any = {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: aspectRatio
  };

  let request: any = {
      model: 'veo-3.1-fast-generate-preview',
      config
  };

  if (imageBytes) {
      // Image to Video
      request.image = {
          imageBytes: imageBytes,
          mimeType: 'image/png'
      };
      request.prompt = prompt || "Animate this image"; 
  } else {
      // Text to Video
      request.prompt = prompt;
  }

  let operation = await ai.models.generateVideos(request);

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s poll
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (uri) {
    return `${uri}&key=${process.env.API_KEY}`;
  }
  return null;
};

// --- AUDIO TRANSCRIPTION ---

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'audio/mp3', data: audioBase64 } },
                { text: "Transcribe this audio exactly." }
            ]
        }
    });
    return response.text || "";
};

// --- TEXT TO SPEECH ---

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });

        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
    } catch (e) {
        console.error("TTS Error", e);
    }
    return null;
};

// --- STREAMING ---

export const generateAIStream = async (prompt: string, onChunk: (text: string) => void) => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite', 
            contents: `You are a helpful assistant in a developer community app. ${prompt}`,
        });

        for await (const chunk of response) {
            if (chunk.text) {
                onChunk(chunk.text);
            }
        }
    } catch (e) {
        console.error(e);
        onChunk("\n[Error fetching response]");
    }
}