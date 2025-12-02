// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // DEBUG LOG 1: Check if key exists (don't log the full key for security)
    console.log("Server API Key Check:", apiKey ? `Present (Starts with ${apiKey.substring(0, 4)}...)` : "Missing");

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    const { message, image, factCheck } = await req.json();
    console.log("Received message:", message); // DEBUG LOG 2
    console.log("Received image:", image ? "Yes" : "No"); // DEBUG LOG 2
    console.log("Fact check mode:", factCheck ? "Yes" : "No"); // DEBUG LOG 2

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure model with Google Search grounding if fact check mode is enabled
    const modelConfig: any = { model: "gemini-2.0-flash-exp" };
    
    if (factCheck) {
      // Enable Google Search retrieval for research mode
      modelConfig.tools = [
        {
          googleSearch: {}
        }
      ];
    }
    
    const model = genAI.getGenerativeModel(modelConfig);
    
    // Prepare parts array for Gemini API
    // If image is provided, include it first, then the text message
    const parts = [];
    
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    
    // Add the text message (or a default prompt if no message but image exists)
    let textMessage = message?.trim() || (image ? "What can you tell me about this image?" : "");
    
    // If fact check mode is enabled, add instruction to search and cite sources
    if (factCheck && textMessage) {
      textMessage = `Please research the following topic using Google Search and provide a comprehensive summary with citations: ${textMessage}

Please:
1. Search for current and reliable information on this topic
2. Summarize the key findings
3. Cite your sources with proper attribution
4. Format citations as clickable links when possible`;
    }
    
    if (textMessage) {
      parts.push({
        text: textMessage,
      });
    }
    
    // If no parts, return error
    if (parts.length === 0) {
      return NextResponse.json(
        { error: "No message or image provided." },
        { status: 400 }
      );
    }
        
    const result = await model.generateContent(parts);
    const response = result.response;
    const responseText = response.text();
    
    // Extract citations if fact check mode is enabled
    let citations: any[] = [];
    if (factCheck && response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      
      // Extract grounding metadata (citations from Google Search)
      if (candidate.groundingMetadata) {
        const groundingChunks = candidate.groundingMetadata.groundingChunks || [];
        citations = groundingChunks.map((chunk: any) => {
          if (chunk.web && chunk.web.uri) {
            return {
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
              snippet: chunk.web.snippet || ""
            };
          }
          return null;
        }).filter((citation: any) => citation !== null);
      }
    }

    return NextResponse.json({ 
      reply: responseText || "",
      citations: citations.length > 0 ? citations : undefined
    });
  } catch (error: any) {
    // DEBUG LOG 3: Print the FULL error object
    console.error("FULL GEMINI ERROR:", JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { error: error.message || "Failed to generate response from Gemini." },
      { status: 500 }
    );
  }
}