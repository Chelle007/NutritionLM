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

    const { message, image } = await req.json();
    console.log("Received message:", message); // DEBUG LOG 2
    console.log("Received image:", image ? "Yes" : "No"); // DEBUG LOG 2

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use a model that supports vision (gemini-2.0-flash-exp supports images)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
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
    const textMessage = message?.trim() || (image ? "What can you tell me about this image?" : "");
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
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText || "" });
  } catch (error: any) {
    // DEBUG LOG 3: Print the FULL error object
    console.error("FULL GEMINI ERROR:", JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { error: error.message || "Failed to generate response from Gemini." },
      { status: 500 }
    );
  }
}