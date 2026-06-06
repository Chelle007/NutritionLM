import {
  GoogleGenAI,
  type Chat,
  type Content,
  type GenerateContentConfig,
  type GenerateContentResponse,
} from "@google/genai";
import { EMBEDDING_DIMENSIONS, GEMINI_MODELS } from "../app/constants/gemini";

let client: GoogleGenAI | null = null;

export class GeminiApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly statusLabel?: string;

  constructor(
    message: string,
    status: number,
    options?: { code?: number; statusLabel?: string }
  ) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
    this.code = options?.code;
    this.statusLabel = options?.statusLabel;
  }
}

function mapGeminiHttpStatus(code: number): number {
  if (code === 429) return 429;
  if (code === 400) return 400;
  if (code === 403) return 403;
  if (code === 404) return 404;
  if (code >= 500) return 502;
  return 500;
}

function formatGeminiUserMessage(
  code: number,
  statusLabel: string,
  rawMessage: string
): string {
  if (code === 429 || statusLabel === "RESOURCE_EXHAUSTED") {
    return "Gemini API quota exceeded. Check your plan and billing at https://ai.dev/rate-limit, or try again later.";
  }
  if (code === 403 || statusLabel === "PERMISSION_DENIED") {
    return "Gemini API access denied. Verify your API key and billing settings in Google AI Studio.";
  }
  if (rawMessage.includes("API key not valid") || rawMessage.includes("API_KEY_INVALID")) {
    return "Invalid Gemini API key. Update GEMINI_API_KEY in your environment.";
  }
  if (code === 503 || statusLabel === "UNAVAILABLE") {
    return "Gemini API is temporarily unavailable. Please try again shortly.";
  }
  return rawMessage;
}

export function parseGeminiApiError(error: unknown): GeminiApiError | null {
  if (error instanceof GeminiApiError) {
    return error;
  }

  const err = error as { name?: string; status?: number; message?: string };
  const looksLikeGemini =
    err?.name === "ApiError" ||
    (typeof err?.message === "string" && err.message.includes('"error"'));

  if (!looksLikeGemini) {
    return null;
  }

  let rawMessage = err.message || "Gemini API request failed";
  let code = err.status ?? 500;
  let statusLabel = "";

  try {
    const parsed = JSON.parse(err.message || "");
    const apiError = parsed?.error;
    if (typeof apiError?.message === "string") rawMessage = apiError.message;
    if (typeof apiError?.code === "number") code = apiError.code;
    if (typeof apiError?.status === "string") statusLabel = apiError.status;
  } catch {
    // keep raw message
  }

  return new GeminiApiError(
    formatGeminiUserMessage(code, statusLabel, rawMessage),
    mapGeminiHttpStatus(code),
    { code, statusLabel: statusLabel || undefined }
  );
}

/** Normalize any thrown value into an HTTP-friendly error payload. */
export function getErrorResponse(error: unknown): {
  message: string;
  status: number;
} {
  const geminiError = parseGeminiApiError(error);
  if (geminiError) {
    return { message: geminiError.message, status: geminiError.status };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  return { message: "An unexpected error occurred", status: 500 };
}

async function withGeminiErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const geminiError = parseGeminiApiError(error);
    if (geminiError) throw geminiError;
    throw error;
  }
}

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }
  return apiKey;
}

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return client;
}

export async function generateContent(params: {
  model: string;
  contents: unknown;
  config?: GenerateContentConfig;
}): Promise<GenerateContentResponse> {
  return withGeminiErrorHandling(async () => {
    const ai = getGeminiClient();
    return ai.models.generateContent({
      model: params.model,
      contents: params.contents as Parameters<
        typeof ai.models.generateContent
      >[0]["contents"],
      config: params.config,
    });
  });
}

export function createChat(params: {
  model: string;
  history?: Content[];
  config?: GenerateContentConfig;
}) {
  const ai = getGeminiClient();
  return ai.chats.create({
    model: params.model,
    history: params.history,
    config: params.config,
  });
}

export async function sendChatMessage(
  chat: Chat,
  message: unknown
): Promise<GenerateContentResponse> {
  return withGeminiErrorHandling(async () => {
    return chat.sendMessage({
      message: message as Parameters<Chat["sendMessage"]>[0]["message"],
    });
  });
}

export async function generateFastText(prompt: string): Promise<string> {
  const response = await generateContent({
    model: GEMINI_MODELS.fast,
    contents: prompt,
  });
  return getResponseText(response);
}

export async function generateFastJson(prompt: string): Promise<unknown> {
  const text = await generateFastText(prompt);
  return parseJsonFromResponse(text);
}

export async function generatePrimaryContent(params: {
  contents: unknown;
  config?: GenerateContentConfig;
}): Promise<GenerateContentResponse> {
  return generateContent({
    model: GEMINI_MODELS.primary,
    contents: params.contents,
    config: params.config,
  });
}

export async function embedText(text: string): Promise<number[]> {
  return withGeminiErrorHandling(async () => {
    const ai = getGeminiClient();
    const response = await ai.models.embedContent({
      model: GEMINI_MODELS.embedding,
      contents: text,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values?.length) {
      throw new Error("No embedding returned from Gemini API");
    }
    return values;
  });
}

export async function embedQuery(text: string): Promise<number[]> {
  return withGeminiErrorHandling(async () => {
    const ai = getGeminiClient();
    const response = await ai.models.embedContent({
      model: GEMINI_MODELS.embedding,
      contents: text,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_QUERY",
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values?.length) {
      throw new Error("No embedding returned from Gemini API");
    }
    return values;
  });
}

export function getResponseText(response: GenerateContentResponse): string {
  return response.text ?? "";
}

export function parseJsonFromResponse(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonString = jsonMatch ? jsonMatch[1] : text;
  jsonString = jsonString.trim();

  const startIndex = jsonString.indexOf("{");
  if (startIndex !== -1) {
    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < jsonString.length; i++) {
      if (jsonString[i] === "{") braceCount++;
      else if (jsonString[i] === "}") {
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

  return JSON.parse(jsonString.trim());
}

export function extractGroundingCitations(response: GenerateContentResponse) {
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (!groundingMetadata?.groundingChunks) {
    return [];
  }

  return (groundingMetadata.groundingChunks || [])
    .map((chunk) => {
      if (chunk.web?.uri) {
        const web = chunk.web as { title?: string; uri?: string; snippet?: string };
        return {
          title: web.title || web.uri,
          uri: web.uri,
          snippet: web.snippet || "",
        };
      }
      return null;
    })
    .filter(Boolean);
}
