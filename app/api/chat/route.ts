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

    const { message } = await req.json();
    console.log("Received message:", message); // DEBUG LOG 2

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try "gemini-pro" if "gemini-1.5-flash" fails, sometimes region/tier specific
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
    const result = await model.generateContent(message);
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