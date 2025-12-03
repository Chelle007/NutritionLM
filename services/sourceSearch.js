// Service for semantic search across user sources

import { createClient } from '../app/utils/supabase/server';
import { generateEmbedding, cosineSimilarity } from './documentProcessor.js';

/**
 * Search for relevant source chunks based on user query
 * Returns top N most relevant chunks with their source information
 */
export async function searchRelevantSources(userId, query, topK = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all source chunks for this user
    const supabase = await createClient();
    
    const { data: chunks, error } = await supabase
      .from('source_chunks')
      .select(`
        id,
        source_id,
        content,
        chunk_index,
        embedding,
        metadata,
        user_sources!inner (
          id,
          title,
          file_name,
          file_type,
          user_id
        )
      `)
      .eq('user_sources.user_id', userId)
      .not('embedding', 'is', null);
    
    if (error) {
      console.error('Error fetching source chunks:', error);
      throw error;
    }
    
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Calculate similarity scores for each chunk
    const chunksWithScores = chunks.map(chunk => {
      if (!chunk.embedding) {
        return { ...chunk, similarity: 0 };
      }
      
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        ...chunk,
        similarity
      };
    });
    
    // Sort by similarity (highest first) and take top K
    const topChunks = chunksWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(chunk => chunk.similarity > 0.3); // Only return chunks with similarity > 0.3
    
    // Format the results
    return topChunks.map(chunk => ({
      id: chunk.id,
      sourceId: chunk.source_id,
      sourceTitle: chunk.user_sources.title,
      sourceType: chunk.user_sources.file_type,
      chunkText: chunk.content, // Use 'content' to match schema
      chunkIndex: chunk.chunk_index,
      similarity: chunk.similarity,
      metadata: chunk.metadata
    }));
    
  } catch (error) {
    console.error('Error searching relevant sources:', error);
    throw error;
  }
}

/**
 * Format relevant sources as context for the AI prompt
 */
export function formatSourcesAsContext(relevantSources) {
  if (!relevantSources || relevantSources.length === 0) {
    return '';
  }
  
  let context = '\n\n### USER UPLOADED SOURCES (Use this information when relevant):\n\n';
  
  relevantSources.forEach((source, index) => {
    context += `[Source ${index + 1}: ${source.sourceTitle} (${source.sourceType})]\n`;
    context += `${source.chunkText}\n\n`;
  });
  
  context += '---\n';
  context += 'When answering questions, prioritize information from the user\'s uploaded sources above when it\'s relevant to their question. ';
  context += 'If the question is not related to their uploaded sources, use your general knowledge.\n';
  
  return context;
}

