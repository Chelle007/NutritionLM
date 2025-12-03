// Service for semantic search across user sources

import { createClient } from '../app/utils/supabase/server';
import { generateEmbedding, cosineSimilarity } from './documentProcessor.js';

/**
 * Search for sources by filename/title matching (fallback for personal queries)
 */
export async function searchSourcesByFilename(userId, query, topK = 10) {
  try {
    const supabase = await createClient();
    const queryLower = query.toLowerCase();
    const queryKeywords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    // Get all sources for this user
    const { data: sources, error } = await supabase
      .from('user_sources')
      .select('id, title, file_name, file_type')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching sources:', error);
      return [];
    }
    
    if (!sources || sources.length === 0) {
      return [];
    }
    
    // Find sources with matching filenames/titles
    // For queries like "what's my restriction details", look for "restriction" and "details"
    const matchingSources = sources.filter(source => {
      const fileName = (source.file_name || '').toLowerCase();
      const title = (source.title || '').toLowerCase();
      
      // Check if any keyword matches the filename or title
      const hasMatch = queryKeywords.some(keyword => 
        fileName.includes(keyword) || title.includes(keyword)
      );
      
      // Also check if the query contains words that match the filename (e.g., "restriction details" matches "restriction details.txt")
      const queryWords = queryLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
      const fileNameWords = fileName.replace(/[^\w\s]/g, ' ').split(/\s+/);
      const titleWords = title.replace(/[^\w\s]/g, ' ').split(/\s+/);
      
      const hasWordMatch = queryWords.some(qw => 
        fileNameWords.some(fw => fw.includes(qw) || qw.includes(fw)) ||
        titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
      );
      
      return hasMatch || hasWordMatch;
    });
    
    if (matchingSources.length === 0) {
      console.log('No sources found matching filename keywords:', queryKeywords);
      return [];
    }
    
    console.log(`Found ${matchingSources.length} matching source(s) by filename:`, matchingSources.map(s => s.file_name || s.title));
    
    // Get all chunks from matching sources
    const sourceIds = matchingSources.map(s => s.id);
    console.log('Searching for chunks with source_ids:', sourceIds);
    
    // Try both column names in case the database has different schema
    let chunks = null;
    let chunksError = null;
    
    // First try with chunk_text
    const { data: chunks1, error: error1 } = await supabase
      .from('source_chunks')
      .select(`
        id,
        source_id,
        chunk_text,
        chunk_index,
        metadata,
        user_sources!inner (
          id,
          title,
          file_name,
          file_type,
          user_id
        )
      `)
      .in('source_id', sourceIds)
      .order('chunk_index', { ascending: true });
    
    if (error1 && error1.code === '42703') {
      // Column doesn't exist, try with 'content' instead
      console.log('chunk_text column not found, trying content column');
      const { data: chunks2, error: error2 } = await supabase
        .from('source_chunks')
        .select(`
          id,
          source_id,
          content,
          chunk_index,
          metadata,
          user_sources!inner (
            id,
            title,
            file_name,
            file_type,
            user_id
          )
        `)
        .in('source_id', sourceIds)
        .order('chunk_index', { ascending: true });
      
      chunks = chunks2;
      chunksError = error2;
    } else {
      chunks = chunks1;
      chunksError = error1;
    }
    
    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
      return [];
    }
    
    console.log(`Found ${chunks?.length || 0} chunks from matching sources`);
    if (chunks && chunks.length > 0) {
      console.log('Sample chunk:', {
        id: chunks[0].id,
        source_id: chunks[0].source_id,
        has_chunk_text: !!chunks[0].chunk_text,
        has_content: !!chunks[0].content,
        chunk_index: chunks[0].chunk_index
      });
    }
    
    // Format and return chunks (limit to topK)
    const result = (chunks || []).slice(0, topK).map(chunk => ({
      id: chunk.id,
      sourceId: chunk.source_id,
      sourceTitle: chunk.user_sources.title,
      sourceType: chunk.user_sources.file_type,
      chunkText: chunk.chunk_text || chunk.content, // Support both column names
      chunkIndex: chunk.chunk_index,
      similarity: 1.0, // High similarity since filename matched
      metadata: chunk.metadata
    }));
    
    console.log(`Returning ${result.length} chunks from filename search`);
    return result;
    
  } catch (error) {
    console.error('Error searching sources by filename:', error);
    return [];
  }
}

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
        chunk_text,
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
    // Lower threshold for personal detail queries (e.g., "my restrictions", "my details")
    const queryLower = query.toLowerCase();
    const isPersonalQuery = queryLower.includes('my ') ||
                            queryLower.includes('restriction') ||
                            queryLower.includes('allergy') ||
                            queryLower.includes('detail') ||
                            queryLower.includes('personal');
    const similarityThreshold = isPersonalQuery ? 0.2 : 0.3; // Lower threshold for personal queries
    
    let topChunks = chunksWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(chunk => chunk.similarity > similarityThreshold);
    
    // Fallback: If no chunks found and it's a personal query, try filename matching
    if (topChunks.length === 0 && isPersonalQuery) {
      // Extract keywords from query
      const queryKeywords = queryLower.split(/\s+/).filter(word => word.length > 2);
      
      // Find chunks from sources with matching filenames/titles
      const filenameMatchedChunks = chunksWithScores
        .filter(chunk => {
          const fileName = chunk.user_sources.file_name?.toLowerCase() || '';
          const title = chunk.user_sources.title?.toLowerCase() || '';
          return queryKeywords.some(keyword => 
            fileName.includes(keyword) || title.includes(keyword)
          );
        })
        .sort((a, b) => {
          // Sort by filename match first, then by similarity
          const aMatches = queryKeywords.filter(k => 
            (a.user_sources.file_name?.toLowerCase() || '').includes(k) ||
            (a.user_sources.title?.toLowerCase() || '').includes(k)
          ).length;
          const bMatches = queryKeywords.filter(k => 
            (b.user_sources.file_name?.toLowerCase() || '').includes(k) ||
            (b.user_sources.title?.toLowerCase() || '').includes(k)
          ).length;
          if (aMatches !== bMatches) return bMatches - aMatches;
          return b.similarity - a.similarity;
        });
      
      if (filenameMatchedChunks.length > 0) {
        // For filename matches, include more chunks (up to 10) to get full context
        topChunks = filenameMatchedChunks.slice(0, Math.max(topK, 10));
      }
    }
    
    // Format the results
    return topChunks.map(chunk => ({
      id: chunk.id,
      sourceId: chunk.source_id,
      sourceTitle: chunk.user_sources.title,
      sourceType: chunk.user_sources.file_type,
      chunkText: chunk.chunk_text || chunk.content, // Support both column names
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
  
  let context = '\n\n### USER UPLOADED SOURCES (Contains User\'s Personal Information):\n';
  context += '**IMPORTANT:** The information below contains the user\'s personal details (dietary restrictions, allergies, medical conditions, preferences, etc.) that they have explicitly uploaded and want you to use.\n\n';
  
  relevantSources.forEach((source, index) => {
    context += `[Source ${index + 1}: ${source.sourceTitle} (${source.sourceType})]\n`;
    context += `${source.chunkText}\n\n`;
  });
  
  context += '---\n';
  context += '**CRITICAL INSTRUCTIONS:**\n';
  context += '1. When the user asks about their personal details (e.g., "what are my restrictions?", "what are my allergies?", "what\'s my restriction details?", "tell me about my dietary restrictions"), you MUST use the information from the sources above.\n';
  context += '2. The user has explicitly given you permission to access this personal information by uploading it.\n';
  context += '3. Do NOT refuse to answer questions about personal details - the user wants you to use this information.\n';
  context += '4. Prioritize information from the user\'s uploaded sources above when it\'s relevant to their question.\n';
  context += '5. If the question is not related to their uploaded sources, use your general knowledge.\n';
  
  return context;
}

