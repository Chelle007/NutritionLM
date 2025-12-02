// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Verify env var is loaded (masking the actual key)
    console.log("API Key Status:", apiKey ? `Loaded (${apiKey.substring(0, 4)}...)` : "Missing");

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    const { message, image, factCheck } = await req.json();
    
    // Quick payload check
    console.log("Request params:", { 
        hasMessage: !!message, 
        hasImage: !!image, 
        isResearchMode: !!factCheck 
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Default model config
    const modelConfig: any = { model: "gemini-2.0-flash-exp" };
    
    // Add search tool if research mode is active
    if (factCheck) {
      modelConfig.tools = [{ googleSearch: {} }];
    }
    
    const model = genAI.getGenerativeModel(modelConfig);
    
    // Build prompt parts. Note: Images must precede text input.
    const parts = [];
    
    if (image?.data && image?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    
    // Handle text input or fallback for image-only requests
    let textMessage = message?.trim() || (image ? "What can you tell me about this image?" : "");
    
    // Inject strict sourcing requirements for research mode
    if (factCheck && textMessage) {
      textMessage = `Please research the following topic using Google Search and provide a comprehensive summary with citations: ${textMessage}

Please:
1. Search for current and reliable information on this topic
2. Summarize the key findings
3. Cite your sources with proper attribution
4. Format citations as clickable links when possible`;
    }
    
    if (textMessage) {
      parts.push({ text: textMessage });
    }
    
    if (parts.length === 0) {
      return NextResponse.json(
        { error: "No message or image provided." },
        { status: 400 }
      );
    }
        
    const result = await model.generateContent(parts);
    const response = result.response;
    const responseText = response.text();
    
    // Parse grounding metadata for sources if available
    let citations: any[] = [];
    if (factCheck && response.candidates?.[0]?.groundingMetadata) {
      const { groundingChunks } = response.candidates[0].groundingMetadata;
      
      citations = (groundingChunks || [])
        .map((chunk: any) => {
          if (chunk.web?.uri) {
            return {
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
              snippet: chunk.web.snippet || ""
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return NextResponse.json({ 
      reply: responseText || "",
      citations: citations.length > 0 ? citations : undefined
    });

  } catch (error: any) {
    // Log full error stack for debugging
    console.error("Gemini API Error:", JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { error: error.message || "Failed to generate response." },
      { status: 500 }
    );
  }
}