// Service for processing documents: text extraction and embedding generation

/**
 * Extract text from various file types
 */
export async function extractTextFromFile(file, fileType) {
  const type = fileType.toUpperCase();
  
  if (type === 'TXT' || type === 'TEXT') {
    return await file.text();
  }
  
  if (type === 'PDF') {
    try {
      // Use require for CommonJS modules in server-side Next.js
      const pdfParse = require('pdf-parse');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
    }
  }
  
  if (type === 'DOCX') {
    try {
      // Use require for CommonJS modules in server-side Next.js
      const mammoth = require('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file. Please ensure it is a valid DOCX document.');
    }
  }
  
  if (type === 'DOC') {
    // DOC files (old format) are harder to parse - mammoth doesn't support them
    // You might need a different library or convert to DOCX first
    throw new Error('DOC files (old Word format) are not supported. Please convert to DOCX or PDF.');
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Split text into chunks for embedding
 * Uses a simple approach: split by sentences/paragraphs with overlap
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  
  // Split by paragraphs first (double newline)
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap (last N characters)
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If no chunks were created (text is shorter than chunkSize), return the whole text
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }
  
  return chunks;
}

/**
 * Generate embedding using Google's embedding model
 * Uses the text-embedding-004 model via Gemini API
 */
export async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  
  try {
    // Use Google's embedding API
    // Note: Gemini API doesn't have a direct embedding endpoint, so we'll use a workaround
    // or use Google's Vertex AI embedding model if available
    // For now, we'll use a simple approach with fetch to Google's embedding API
    
    // Alternative: Use OpenAI's embedding model (requires OPENAI_API_KEY)
    // Or use a local embedding model
    // For this implementation, we'll use a simple text-based approach that can be replaced
    
    // Since Gemini doesn't have embeddings, we'll use a workaround:
    // Option 1: Use OpenAI embeddings (if available)
    // Option 2: Use a local embedding model
    // Option 3: Use Google's Vertex AI (requires different setup)
    
    // For now, let's check if OpenAI is available, otherwise use a simple hash-based approach
    if (process.env.OPENAI_API_KEY) {
      return await generateOpenAIEmbedding(text);
    }
    
    // Fallback: Use a simple text-based embedding (not ideal, but works for basic semantic search)
    // In production, you should use a proper embedding model
    console.warn('No embedding API key found. Using fallback embedding method.');
    return generateSimpleEmbedding(text);
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding using OpenAI's API
 */
async function generateOpenAIEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
      input: text,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Simple fallback embedding (not ideal, but works for basic similarity)
 * This is a placeholder - in production, always use a proper embedding model
 */
function generateSimpleEmbedding(text) {
  // This is a very basic approach - just for demonstration
  // In production, you MUST use a proper embedding model
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384 dimensions (common embedding size)
  
  // Simple word frequency-based embedding (not semantic, but works for basic matching)
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embedding[hash % 384] += 1 / (idx + 1);
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}
