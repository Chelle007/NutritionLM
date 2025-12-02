import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const { message, image, factCheck, compare } = await req.json();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Base Configuration
    let modelConfig: any = { 
        model: "gemini-2.0-flash-exp",
    };

    let systemInstruction = "";

    // 2a. Handle "Compare" Mode
    if (compare) {
      modelConfig.generationConfig = { responseMimeType: "application/json" };
      modelConfig.tools = [{ googleSearch: {} }]; 
      
      systemInstruction = `
          You are a helpful nutrition assistant. 
          The user wants a factual comparison on the topic. 
          
          1. FIRST, use Google Search to find the latest scientific consensus.
          2. THEN, analyze the topic from two distinct perspectives.
          3. Use inline citations like [1], [2] in your bullet points and summary to verify your claims.
          4. FINALLY, return the result in this EXACT JSON format:
          {
              "sideA": { "title": "Title", "points": ["point 1 [1]", "point 2 [2]"] },
              "sideB": { "title": "Title", "points": ["point 3 [1]", "point 4 [3]"] },
              "summary": "A balanced 2-sentence conclusion [2].",
              "sources": [
                  { "title": "Source Title", "uri": "URL" }
              ]
          }
          CRITICAL: Ensure the citation numbers [1] in the text correspond exactly to the index (1-based) of the source in the "sources" list.
      `;
    }
    
    // 2b. Handle "Fact Check" Mode
    else if (factCheck) {
        modelConfig.tools = [{ googleSearch: {} }];
    }

    const model = genAI.getGenerativeModel({ ...modelConfig, systemInstruction });

    // 3. Build Prompt
    const parts = [];
    if (image?.data) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
    }

    let textMessage = message || (image ? "Analyze this image" : "");

    if (compare) {
        textMessage = `Search the web and compare perspectives on: "${textMessage}"`;
    } 
    else if (factCheck) {
        textMessage = `Research and summarize: ${textMessage}`;
    }

    parts.push({ text: textMessage });

    const result = await model.generateContent(parts);
    const response = result.response;
    const responseText = response.text();

    // 4. Extract Grounding Metadata (Citations)
    // This works for both Compare and Fact Check modes automatically
    let citations: any[] = [];
    if (response.candidates?.[0]?.groundingMetadata) {
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
        reply: responseText, 
        isComparison: compare,
        citations: citations 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}