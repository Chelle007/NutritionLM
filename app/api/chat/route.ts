// [START] documentation reference: https://ai.google.dev/gemini-api/docs/models | https://ai.google.dev/gemini-api/docs
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
        model: "gemini-2.0-flash-exp", // or "gemini-2.5-pro" for better results
    };

    let systemInstruction = "";

    // 2a. Handle "Compare" Mode
    if (compare) {
      modelConfig.generationConfig = { responseMimeType: "application/json" };
      modelConfig.tools = [{ googleSearch: {} }]; 
      
      systemInstruction = `
          You are a helpful nutrition assistant. 
          The user wants a factual comparison on the topic. 
          
          1. FIRST, use Google Search to find at least 5 authoritative sources on the latest scientific consensus.
          2. THEN, analyze the topic from two distinct perspectives.
          3. Use inline citations like [1], [2], [3], [4], [5] in your bullet points and summary to verify your claims.
          4. Ensure you cite at least 5 different sources throughout your response.
          5. FINALLY, return the result in this EXACT JSON format:
          {
              "sideA": { "title": "Title", "points": ["point 1 [1]", "point 2 [2]"] },
              "sideB": { "title": "Title", "points": ["point 3 [3]", "point 4 [4]"] },
              "summary": "A balanced 2-sentence conclusion [5].",
              "sources": [
                  { "title": "Source Title", "uri": "URL" }
              ]
          }
          CRITICAL: 
          - Search and use at least 5 different sources
          - Ensure the citation numbers [1], [2], [3], [4], [5] in the text correspond exactly to the index (1-based) of the source in the "sources" list.
          - Include at least 5 sources in the sources array.
      `;
    }

    // 2b. Handle "Fact Check" Mode
    else if (factCheck) {
        modelConfig.tools = [{ googleSearch: {} }];

        systemInstruction = `
          You are a helpful nutrition assistant. The user wants a factual fact check on the topic.
          
          IMPORTANT REQUIREMENTS:
          1. Use Google Search to find at least 5 authoritative sources to fact-check the information.
          2. Verify all claims against these sources.
          3. Use inline citations like [1], [2], [3], [4], [5] throughout your response to cite your sources.
          4. Ensure you reference at least 5 different sources in your fact-check.
          5. Format your response with clear citations for each factual claim you make.
          
          Structure your response:
          - Start with a brief summary of what you're fact-checking
          - Provide detailed fact-checking with citations [1], [2], etc. for each claim
          - Conclude with a summary of findings
          - Always cite your sources using [1], [2], [3], [4], [5] format
        `;
    }

    const model = genAI.getGenerativeModel({ ...modelConfig, systemInstruction });

    // 3. Build Prompt
    const parts = [];
    if (image?.data) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
    }

    let textMessage = message || (image ? "Analyze this image" : "");

    if (compare) {
        textMessage = `Search the web and compare perspectives on: "${textMessage}". Find at least 5 authoritative sources.`;
    } 
    else if (factCheck) {
        textMessage = `Research and fact-check: ${textMessage}. Search for at least 5 authoritative sources and cite them using [1], [2], [3], [4], [5] format.`;
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
// [END]