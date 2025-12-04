// [START] documentation reference: https://ai.google.dev/gemini-api/docs/models | https://ai.google.dev/gemini-api/docs
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "../../utils/supabase/server";
import { searchRelevantSources, formatSourcesAsContext, searchSourcesByFilename } from "../../../services/sourceSearch";

/**
 * Validates if a message is related to food/nutrition
 * Returns true if the message is food/nutrition related, false otherwise
 */
function isFoodNutritionRelated(message: string): boolean {
  if (!message || message.trim().length === 0) {
    return true; // Empty messages or image-only queries are allowed
  }

  const lowerMessage = message.toLowerCase();
  
  // Food and nutrition related keywords
  const foodNutritionKeywords = [
    // Food items
    'food', 'meal', 'dish', 'recipe', 'cooking', 'ingredient', 'snack', 'breakfast', 'lunch', 'dinner',
    'fruit', 'vegetable', 'grain', 'protein', 'carb', 'fat', 'fiber', 'vitamin', 'mineral',
    'calorie', 'calories', 'nutrition', 'nutrient', 'diet', 'dietary', 'eating', 'consume',
    
    // Health and nutrition concepts
    'health', 'healthy', 'nutrition', 'nutritious', 'wellness', 'wellbeing', 'dietary',
    'allergy', 'allergies', 'intolerance', 'restriction', 'restrictions', 'preference', 'preferences',
    'macro', 'macronutrient', 'micronutrient', 'supplement', 'supplements',
    
    // Body and health metrics (in nutrition context)
    'weight', 'obesity', 'overweight', 'underweight', 'bmi', 'body mass',
    'metabolism', 'metabolic', 'digest', 'digestion', 'digestive',
    
    // Medical conditions related to nutrition
    'diabetes', 'diabetic', 'celiac', 'gluten', 'lactose', 'vegan', 'vegetarian', 'keto', 'paleo',
    'anemia', 'deficiency', 'malnutrition', 'obesity',
    
    // Food groups and categories
    'dairy', 'meat', 'poultry', 'fish', 'seafood', 'plant', 'organic', 'processed',
    'whole grain', 'wholegrain', 'legume', 'nut', 'seed', 'herb', 'spice',
    
    // Cooking and preparation
    'cook', 'bake', 'roast', 'grill', 'steam', 'boil', 'fry', 'preparation', 'prep',
    
    // Nutritional information
    'nutritional', 'nutrition facts', 'food label', 'serving size', 'portion', 'serving',
    'daily value', 'rda', 'recommended', 'intake', 'requirement', 'needs',
    
    // Food safety
    'food safety', 'foodborne', 'expiration', 'expiry', 'storage', 'preserve', 'preservation',
    
    // Personal queries (often nutrition-related)
    'my diet', 'my food', 'my meal', 'my nutrition', 'my restriction', 'my allergy',
    'what should i eat', 'what can i eat', 'what to eat', 'should i eat',
    
    // Common nutrition questions
    'how much', 'how many calories', 'is healthy', 'is good for', 'benefits of', 'effects of',
    'source of', 'rich in', 'contains', 'has', 'provide', 'provides',
    
    // Action words in nutrition context
    'count', 'show', 'list', 'display', 'get my', 'tell me my'
  ];
  
  // Check if message contains food/nutrition keywords first
  const hasFoodKeyword = foodNutritionKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Action words that are commonly used with nutrition queries (should be allowed)
  const nutritionActionWords = ['count', 'show', 'list', 'get', 'tell', 'what', 'how many', 'how much', 'display', 'find'];
  
  // Special patterns for nutrition queries (e.g., "how many nutrition", "count my nutrition", "can u count how many nutrition i have")
  const nutritionQueryPatterns = [
    /\b(how many|how much|count|show|list|get|tell)\s+.*?\b(nutrition|nutrient|food|meal|diet|calorie|macro)\b/i,
    /\b(count|show|list|get|tell)\s+(my|i|me)\s+.*?\b(nutrition|nutrient|food|meal|diet|calorie|macro)\b/i,
    /\b(my|i|me)\s+.*?\b(nutrition|nutrient|food|meal|diet|calorie|macro)\b/i,
    /\b(nutrition|nutrient|food|meal|diet|calorie|macro)\b.*?\b(count|show|list|get|tell|how many|how much)\b/i
  ];
  const matchesNutritionPattern = nutritionQueryPatterns.some(pattern => pattern.test(lowerMessage));
  
  // If message contains nutrition keywords OR nutrition action words, it's likely nutrition-related
  const hasNutritionAction = nutritionActionWords.some(word => lowerMessage.includes(word));
  
  // Non-food/nutrition topics that should be rejected
  const nonFoodTopics = [
    // Math and science
    'solve', 'equation', 'formula', 'math', 'mathematics', 'algebra', 'calculus', 'geometry',
    'physics', 'chemistry', 'biology', 'science', 'experiment', 'hypothesis', 'theory',
    
    // Programming and tech
    'code', 'programming', 'function', 'variable', 'algorithm', 'software', 'hardware', 'computer',
    'javascript', 'python', 'java', 'html', 'css', 'sql', 'database',
    
    // General knowledge (non-nutrition)
    'history', 'geography', 'literature', 'philosophy', 'politics', 'economics', 'finance',
    'weather', 'climate', 'astronomy', 'space', 'planet', 'star',
    
    // Other topics
    'translate', 'translation', 'language', 'grammar', 'syntax'
  ];
  
  // Check for math patterns (e.g., "what is 2+2", "solve 5*3")
  const mathPattern = /\d+\s*[+\-*/]\s*\d+|\b(solve|calculate|compute)\s+\d+/i;
  if (mathPattern.test(lowerMessage) && !hasFoodKeyword) {
    return false;
  }
  
  // If it matches nutrition query patterns, it's definitely related
  if (matchesNutritionPattern) {
    return true;
  }
  
  // If it has food keywords, it's definitely related
  if (hasFoodKeyword) {
    return true;
  }
  
  // If it has nutrition action words AND seems nutrition-related (contains "my", "i", personal pronouns, or nutrition-related terms)
  if (hasNutritionAction) {
    const personalContext = /\b(my|i|me|myself|mine)\b/i.test(lowerMessage);
    const nutritionContext = lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || 
                            lowerMessage.includes('food') || lowerMessage.includes('meal') ||
                            lowerMessage.includes('calorie') || lowerMessage.includes('macro');
    if (personalContext || nutritionContext) {
      return true;
    }
  }
  
  // Check for explicit non-food topics
  for (const topic of nonFoodTopics) {
    if (lowerMessage.includes(topic)) {
      // But allow if it's in a nutrition context (e.g., "calculate calories", "biology of nutrition")
      if (topic === 'calculate' && (lowerMessage.includes('calorie') || lowerMessage.includes('nutrition') || lowerMessage.includes('macro'))) {
        continue;
      }
      if (topic === 'biology' && (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('food'))) {
        continue;
      }
      if (topic === 'chemistry' && (lowerMessage.includes('nutrition') || lowerMessage.includes('food') || lowerMessage.includes('nutrient'))) {
        continue;
      }
      // Reject if it's clearly non-food related and has no food keywords
      const contextWords = ['math', 'mathematics', 'physics', 'programming', 'code', 'equation', 'formula', 'solve', 'algebra', 'calculus'];
      const hasNonFoodContext = contextWords.some(word => lowerMessage.includes(word));
      if (hasNonFoodContext && !hasFoodKeyword) {
        return false;
      }
      // Reject other non-food topics if no food context
      if (!hasFoodKeyword) {
        return false;
      }
    }
  }
  
  // For very short messages or ambiguous queries, be more lenient
  // But if it's clearly a question about non-food topics, reject it
  if (lowerMessage.length < 10) {
    return true; // Very short messages might be image queries or follow-ups
  }
  
  // If no food keywords found and message is substantial, likely not food-related
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, image, factCheck, compare, chatSessionId } = await req.json();
    
    // Validate that the question is food/nutrition related
    const userMessage = message || (image ? "Analyze this image" : "");
    if (userMessage && !isFoodNutritionRelated(userMessage)) {
      return NextResponse.json({ 
        error: "I can only help with food and nutrition-related questions. Please ask me about food, nutrition, diet, health, ingredients, recipes, or related topics.",
        reply: "I'm a nutrition assistant specialized in food and nutrition topics. I can help you with questions about:\n\n• Food and ingredients\n• Nutrition and dietary information\n• Healthy eating and meal planning\n• Dietary restrictions and allergies\n• Nutritional content of foods\n• Recipes and cooking\n• Food safety\n\nPlease ask me a food or nutrition-related question!"
      }, { status: 400 });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Base Configuration
    let modelConfig: any = { 
        model: "gemini-2.0-flash-exp", // or "gemini-2.5-pro" for better results
    };

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
      modelConfig.generationConfig = { responseMimeType: "application/json" };
      modelConfig.tools = [{ googleSearch: {} }]; 
      
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
        modelConfig.tools = [{ googleSearch: {} }];

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
      // For personal queries, search more aggressively (increase topK)
      const queryLower = (message || '').toLowerCase();
      const isPersonalQuery = queryLower.includes('my ') ||
                              queryLower.includes('restriction') ||
                              queryLower.includes('allergy') ||
                              queryLower.includes('detail') ||
                              queryLower.includes('personal');
      const topK = isPersonalQuery ? 10 : 5; // Get more chunks for personal queries
      
      let relevantSources = await searchRelevantSources(user.id, message || '', topK);
      
      // Fallback: If no sources found for personal queries, try filename search
      if ((!relevantSources || relevantSources.length === 0) && isPersonalQuery) {
        console.log('No semantic matches found, trying filename search for personal query');
        relevantSources = await searchSourcesByFilename(user.id, message || '', topK);
      }
      
      if (relevantSources && relevantSources.length > 0) {
        sourcesContext = formatSourcesAsContext(relevantSources);
      }
    } catch (sourceError) {
      console.error("Error searching sources:", sourceError);
      // Continue without sources if search fails
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

    // 6. Ensure chat session exists or create one
    let sessionId = chatSessionId;
    if (!sessionId) {
      // Create a new session if none provided
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
      .limit(50); // Limit to last 50 messages to avoid token limits

    if (historyError) {
      console.error("Error fetching chat history:", historyError);
    }

    // 8. Build conversation history for Gemini
    const history: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      // Convert database messages to Gemini format
      for (const msg of chatHistory) {
        const parts: any[] = [];
        if (msg.image_url) {
          // Note: We can't include image URLs in history, only base64
          // For now, we'll skip images in history
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
      // If image is provided, we could upload it to storage, but for now we'll just store the reference
      // The image data is base64, so we'll store a flag that image was included
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

    // Update session's updated_at timestamp
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // 10. Build current message
    const model = genAI.getGenerativeModel({ ...modelConfig, systemInstruction });
    
    const parts = [];
    if (image?.data) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
    }

    let textMessage = message || (image ? "Analyze this image" : "");

    if (compare) {
        textMessage = `Search the web and compare perspectives on: "${textMessage}". Find at least 5 authoritative sources, prioritizing government and global health authority websites (nih.gov, cdc.gov, who.int, nhs.uk, etc.) over other sources.`;
    } 
    else if (factCheck) {
        textMessage = `Use Google Search to research and fact-check: ${textMessage}. You MUST use the Google Search tool to find at least 5 authoritative sources, prioritizing government and global health authority websites (nih.gov, cdc.gov, who.int, nhs.uk, etc.) over other sources. Cite all sources using [1], [2], [3], [4], [5] format throughout your response.`;
    }

    parts.push({ text: textMessage });

    // 11. Use chat with history if available, otherwise use generateContent
    let result;
    if (history.length > 0) {
      const chat = model.startChat({ history: history });
      result = await chat.sendMessage(parts);
    } else {
      result = await model.generateContent(parts);
    }
    
    const response = result.response;
    const responseText = response.text();

    // 12. Extract Grounding Metadata (Citations)
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
    
    // Log if citations are missing in fact check mode (for debugging)
    if (factCheck && citations.length === 0) {
      console.warn("Fact Check mode: No citations found in grounding metadata. Model may not have used Google Search tool.");
    }

    // 13. Parse comparison data if in compare mode
    let parsedComparison = null;
    if (compare) {
      try {
        let jsonString = responseText;
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        } else {
          // Fallback: strip leading/trailing backticks and "json" label if present
          jsonString = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        }
        
        // Find balanced JSON object using brace counting
        const startIndex = jsonString.indexOf('{');
        if (startIndex !== -1) {
          let braceCount = 0;
          let endIndex = -1;
          for (let i = startIndex; i < jsonString.length; i++) {
            if (jsonString[i] === '{') braceCount++;
            else if (jsonString[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
          }
          if (endIndex !== -1) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
          }
        }
        
        const cleanedJson = jsonString.trim();
        parsedComparison = JSON.parse(cleanedJson);
        // Extract sources from comparison data if available
        if (parsedComparison.sources && Array.isArray(parsedComparison.sources)) {
          citations = parsedComparison.sources;
        }
      } catch (e) {
        console.error("Error parsing comparison JSON:", e);
        // If parsing fails, parsedComparison remains null
      }
    }

    // 14. Save AI response to database
    const metadata: any = {};
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

    // Update session's updated_at timestamp again
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Auto-generate title from first user message if title is still "New Chat"
    if (userMessageText && userMessageText.trim()) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("title")
        .eq("id", sessionId)
        .single();

      if (session && (session.title === "New Chat" || !session.title)) {
        // Generate a short title from the first message (max 50 chars)
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

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// [END]