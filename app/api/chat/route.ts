// [START] documentation reference: https://ai.google.dev/gemini-api/docs/models | https://ai.google.dev/gemini-api/docs
import { NextRequest, NextResponse } from "next/server";
import type { Content, GenerateContentConfig } from "@google/genai";
import { createClient } from "../../utils/supabase/server";
import { searchRelevantSources, formatSourcesAsContext, searchSourcesByFilename } from "../../../services/sourceSearch";
import { GEMINI_MODELS } from "../../constants/gemini";
import {
  createChat,
  generateContent,
  sendChatMessage,
  getResponseText,
  parseJsonFromResponse,
  extractGroundingCitations,
  getErrorResponse,
} from "../../../services/geminiClient";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, image, factCheck, compare, chatSessionId } = await req.json();

    const config: GenerateContentConfig = {};

    // 2. Shared Instructions (Applied across all modes)
    const sourceInstruction = `
      ### 1. CORE BEHAVIOR
      * **STRICT SCOPE LIMITATION:** You are a nutrition assistant and can ONLY answer questions related to food, nutrition, diet, health, ingredients, recipes, cooking, dietary restrictions, allergies, and related topics. You MUST refuse to answer any questions about mathematics, physics, chemistry (unless related to nutrition), programming, general knowledge, history, geography, or any other non-food/nutrition topics. If asked a non-food/nutrition question, politely decline and redirect the user to ask about food or nutrition.
      * **Evidence-Based:** Prioritize information from major health organizations and meta-analyses over single, isolated studies.
      * **Neutral Tone:** Avoid sensationalism, fear-mongering, or hype (e.g., "miracle food," "toxic," "instant cure").
      * **Accessibility:** Explain complex biochemical concepts in simple, plain English.
      
      ### 2. SOURCE HIERARCHY (STRICT - MUST FOLLOW):
      When searching for or providing information, prioritize sources in this exact order:
      
      1. **Tier 1: Government & Global Authority (The "Gold Standard")** - PRIORITIZE THESE:
         * nih.gov (National Institutes of Health)
         * cdc.gov (Centers for Disease Control)
         * usda.gov (U.S. Department of Agriculture - specifically FoodData Central)
         * nutrition.gov (Official U.S. government nutrition portal)
         * who.int (World Health Organization)
         * nhs.uk (National Health Service - UK)
         * canada.ca/en/health-canada (Health Canada)
         * efsa.europa.eu (European Food Safety Authority)
      
      2. **Tier 2: Major Medical & Academic Institutions:**
         * mayoclinic.org (Mayo Clinic)
         * clevelandclinic.org (Cleveland Clinic)
         * hopkinsmedicine.org (Johns Hopkins Medicine)
         * health.harvard.edu (Harvard T.H. Chan School of Public Health)
         * nutrition.tufts.edu (Tufts Friedman School of Nutrition Science)
         * stanford.edu (Stanford Medicine)
         * ucsf.edu (University of California San Francisco Health)
      
      3. **Tier 3: Verified Professional & Disease-Specific Organizations:**
         * eatright.org (Academy of Nutrition and Dietetics)
         * heart.org (American Heart Association)
         * diabetes.org (American Diabetes Association)
         * cancer.org (American Cancer Society)
         * examine.com (Independent, unbiased analysis of supplement research)
      
      4. **Tier 4 (Use with caution):**
         * Peer-reviewed journals (PubMed, Nature) - Only if user specifically requests studies or technical data
      
      **FORBIDDEN SOURCES (DO NOT USE):**
      * Social media (TikTok, Instagram, Reddit)
      * Tabloids or general news sites (Daily Mail, Fox News, CNN)
      * Brand websites selling supplements (except where data is verified by third parties)
      
      ### 3. SAFETY & DISCLAIMERS
      * **Medical Disclaimer:** You are an AI, not a doctor. If a user asks about treating a specific disease (e.g., "diet to cure cancer"), you MUST preface your answer with: "I cannot provide medical advice. Please consult a healthcare professional. Here is general nutritional guidance regarding [topic]..."
      * **IMPORTANT EXCEPTION:** Reading back or summarizing information that the user has explicitly uploaded to the system (such as their dietary restrictions, allergies, or medical conditions) is NOT providing medical advice. The user has given you permission to access and share this information by uploading it. When asked about their personal details from uploaded sources, you MUST provide that information.
      * **Eating Disorders:** If the user exhibits signs of an eating disorder (extreme restriction, purging), provide a supportive, non-judgmental refusal to assist with weight loss and suggest professional help.
    `;

    let modeInstruction = "";
    let systemInstruction = "";

    // 3a. Handle "Compare" Mode
    if (compare) {
      config.responseMimeType = "application/json";
      config.tools = [{ googleSearch: {} }];
      
      modeInstruction = `
        You are an expert Nutrition Assistant grounded in scientific consensus. Your goal is to provide accurate, actionable, and safe nutritional information based on high-quality sources.
        
        The user wants a factual comparison on the topic. 
        
        ### REQUIREMENTS:
        1. FIRST, use Google Search to find at least 5 authoritative sources. STRICTLY prioritize Tier 1 sources (government & global authorities).
        2. If Tier 1 sources are insufficient, then use Tier 2, then Tier 3. Avoid Tier 4 unless specifically needed.
        3. THEN, analyze the topic from two distinct perspectives using evidence-based information.
        4. Use inline citations like [1], [2], [3], [4], [5] in your bullet points and summary to verify your claims.
        5. Ensure you cite at least 5 different sources throughout your response, with preference for Tier 1 sources.
        6. FINALLY, return the result in this EXACT JSON format:
        {
            "sideA": { "title": "Title", "points": ["point 1 [1]", "point 2 [2]"] },
            "sideB": { "title": "Title", "points": ["point 3 [3]", "point 4 [4]"] },
            "summary": "A balanced 2-sentence conclusion [5].",
            "sources": [
                { "title": "Source Title", "uri": "URL" }
            ]
        }
        
        CRITICAL: 
        - Search and use at least 5 different sources, prioritizing Tier 1 (government/global authorities)
        - Ensure the citation numbers [1], [2], [3], [4], [5] in the text correspond exactly to the index (1-based) of the source in the "sources" list.
        - Include at least 5 sources in the sources array.
        - Avoid forbidden sources (social media, tabloids, brand websites)
      `;
    }
    // 3b. Handle "Fact Check" Mode
    else if (factCheck) {
        config.tools = [{ googleSearch: {} }];

        modeInstruction = `
          You are an expert Nutrition Assistant grounded in scientific consensus. Your goal is to provide accurate, actionable, and safe nutritional information based on high-quality sources.
          
          The user wants a factual fact check on the topic.
          
          ### IMPORTANT REQUIREMENTS:
          1. FIRST, you MUST use the Google Search tool to find at least 5 authoritative sources. STRICTLY prioritize Tier 1 sources (government & global authorities).
          2. If Tier 1 sources are insufficient, then use Tier 2, then Tier 3. Avoid Tier 4 unless specifically needed.
          3. Verify all claims against these high-quality sources.
          4. Use inline citations like [1], [2], [3], [4], [5] throughout your response to cite your sources.
          5. Ensure you reference at least 5 different sources in your fact-check, with preference for Tier 1 sources.
          6. Format your response with clear citations for each factual claim you make.
          7. CRITICAL: You must actively use the Google Search tool - do not rely on your training data alone. Search for current, authoritative sources.
          
          ### Structure your response:
          - Start with a brief summary of what you're fact-checking
          - Provide detailed fact-checking with citations [1], [2], etc. for each claim
          - Conclude with a summary of findings
          - Always cite your sources using [1], [2], [3], [4], [5] format
          
          ### SOURCE CITATION:
          - The sources you use will be automatically extracted from your search results
          - Make sure to cite each source with [1], [2], [3], [4], [5] format matching the sources you found
          - At least 5 different sources must be referenced and cited
        `;
    }
    // 3c. Default chat mode
    else {
        modeInstruction = `
          You are an expert Nutrition Assistant grounded in scientific consensus. Your goal is to provide accurate, actionable, and safe nutritional information based on high-quality sources.
          
          ### RESPONSE FORMAT:
          * Start with the "Consensus Answer" (the generally accepted advice).
          * If scientific debate exists, briefly mention the uncertainty (e.g., "While some studies suggest X, others show Y...").
          * Cite your sources clearly when referencing specific information.
        `;
    }

    // 4. Search for relevant user sources (RAG)
    let sourcesContext = '';
    try {
      const queryLower = (message || '').toLowerCase();
      const isPersonalQuery = queryLower.includes('my ') ||
                              queryLower.includes('restriction') ||
                              queryLower.includes('allergy') ||
                              queryLower.includes('detail') ||
                              queryLower.includes('personal');
      const topK = isPersonalQuery ? 10 : 5;
      
      let relevantSources = await searchRelevantSources(user.id, message || '', topK);
      
      if ((!relevantSources || relevantSources.length === 0) && isPersonalQuery) {
        console.log('No semantic matches found, trying filename search for personal query');
        relevantSources = await searchSourcesByFilename(user.id, message || '', topK);
      }
      
      if (relevantSources && relevantSources.length > 0) {
        sourcesContext = formatSourcesAsContext(relevantSources);
      }
    } catch (sourceError) {
      console.error("Error searching sources:", sourceError);
    }

    // 5. Add personal information access instruction if sources are available
    let personalInfoInstruction = '';
    if (sourcesContext) {
      personalInfoInstruction = `
      
      ### CRITICAL: ACCESSING USER'S PERSONAL INFORMATION
      **YOU MUST FOLLOW THESE INSTRUCTIONS:**
      
      1. The user has EXPLICITLY UPLOADED their personal information (dietary restrictions, allergies, medical conditions, preferences, etc.) in the sources provided above.
      
      2. Reading back or summarizing information that the user has uploaded is NOT providing medical advice - it is simply sharing information the user has already provided to you.
      
      3. When the user asks questions about their personal details such as:
         - "what are my restrictions?"
         - "what are my allergies?"
         - "what's my restriction details?"
         - "tell me about my dietary restrictions"
         - Any question starting with "what's my..." or "what are my..." regarding their uploaded information
      
      4. You MUST answer these questions using the information from the uploaded sources above. DO NOT refuse to answer. DO NOT say you cannot provide medical advice. The user wants you to read back their own information.
      
      5. The user has given you EXPLICIT PERMISSION to access this information by uploading it to the system. This is an exception to the general medical advice disclaimer.
      
      6. If you cannot find the information in the sources above, say so clearly, but do NOT refuse on the basis of medical advice concerns.
      `;
    }

    // 6. Combine mode instruction with source instruction and user sources context
    systemInstruction = `${modeInstruction}\n\n${sourceInstruction}${personalInfoInstruction}${sourcesContext}`;
    config.systemInstruction = systemInstruction;

    // 6. Ensure chat session exists or create one
    let sessionId = chatSessionId;
    if (!sessionId) {
      const { data: newSession, error: createError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: "New Chat"
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating chat session:", createError);
        return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 });
      }
      sessionId = newSession.id;
    }

    // 7. Retrieve chat history from database for this session
    const { data: chatHistory, error: historyError } = await supabase
      .from("chat_messages")
      .select("role, message, image_url")
      .eq("user_id", user.id)
      .eq("chat_session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (historyError) {
      console.error("Error fetching chat history:", historyError);
    }

    // 8. Build conversation history for Gemini
    const history: Content[] = [];
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        const parts: { text: string }[] = [];
        if (msg.image_url) {
          // Note: We can't include image URLs in history, only base64
        }
        if (msg.message) {
          parts.push({ text: msg.message });
        }
        if (parts.length > 0) {
          history.push({
            role: msg.role === "user" ? "user" : "model",
            parts: parts
          });
        }
      }
    }

    // 9. Save user message to database
    let imageUrl = null;
    if (image?.data) {
      imageUrl = "base64_included";
    }

    const userMessageText = message || (image ? "Analyze this image" : "");
    
    const { error: saveUserError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        chat_session_id: sessionId,
        role: "user",
        message: userMessageText,
        image_url: imageUrl,
      });

    if (saveUserError) {
      console.error("Error saving user message:", saveUserError);
    }

    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // 10. Build current message
    const messageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (image?.data) {
        messageParts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
    }

    let textMessage = message || (image ? "Analyze this image" : "");

    if (compare) {
        textMessage = `Search the web and compare perspectives on: "${textMessage}". Find at least 5 authoritative sources, prioritizing government and global health authority websites (nih.gov, cdc.gov, who.int, nhs.uk, etc.) over other sources.`;
    } 
    else if (factCheck) {
        textMessage = `Use Google Search to research and fact-check: ${textMessage}. You MUST use the Google Search tool to find at least 5 authoritative sources, prioritizing government and global health authority websites (nih.gov, cdc.gov, who.int, nhs.uk, etc.) over other sources. Cite all sources using [1], [2], [3], [4], [5] format throughout your response.`;
    }

    messageParts.push({ text: textMessage });

    // 11. Use chat with history if available, otherwise use generateContent
    let response;
    if (history.length > 0) {
      const chat = createChat({
        model: GEMINI_MODELS.primary,
        history,
        config,
      });
      response = await sendChatMessage(chat, messageParts);
    } else {
      response = await generateContent({
        model: GEMINI_MODELS.primary,
        contents: messageParts,
        config,
      });
    }
    
    const responseText = getResponseText(response);

    // 12. Extract Grounding Metadata (Citations)
    let citations = extractGroundingCitations(response) as Array<{
      title: string;
      uri: string;
      snippet: string;
    }>;
    
    if (factCheck && citations.length === 0) {
      console.warn("Fact Check mode: No citations found in grounding metadata. Model may not have used Google Search tool.");
    }

    // 13. Parse comparison data if in compare mode
    let parsedComparison: {
      summary?: string;
      sources?: Array<{ title: string; uri: string }>;
    } | null = null;
    if (compare) {
      try {
        parsedComparison = parseJsonFromResponse(responseText) as typeof parsedComparison;
        if (parsedComparison?.sources && Array.isArray(parsedComparison.sources)) {
          citations = parsedComparison.sources.map((source) => ({
            title: source.title,
            uri: source.uri,
            snippet: "",
          }));
        }
      } catch (e) {
        console.error("Error parsing comparison JSON:", e);
      }
    }

    // 14. Save AI response to database
    const metadata: Record<string, unknown> = {};
    if (citations.length > 0) {
      metadata.citations = citations;
    }
    if (compare) {
      metadata.isComparison = true;
      if (parsedComparison) {
        metadata.comparisonData = parsedComparison;
      }
    }
    if (factCheck) {
      metadata.isFactCheck = true;
    }

    const { error: saveAIError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        chat_session_id: sessionId,
        role: "ai",
        message: responseText,
        metadata: metadata,
      });

    if (saveAIError) {
      console.error("Error saving AI message:", saveAIError);
    }

    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (userMessageText && userMessageText.trim()) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("title")
        .eq("id", sessionId)
        .single();

      if (session && (session.title === "New Chat" || !session.title)) {
        const title = userMessageText.length > 50 
          ? userMessageText.substring(0, 47) + "..."
          : userMessageText;
        
        await supabase
          .from("chat_sessions")
          .update({ title })
          .eq("id", sessionId);
      }
    }

    return NextResponse.json({ 
        reply: parsedComparison ? parsedComparison.summary : responseText, 
        isComparison: compare,
        citations: citations,
        chatSessionId: sessionId,
        comparisonData: parsedComparison || undefined
    });

  } catch (error) {
    console.error("API Error:", error);
    const { message, status } = getErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
// [END]
