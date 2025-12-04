# RAG (Retrieval Augmented Generation) Setup Guide

This guide will help you set up the RAG system for user-specific document sources.

## Prerequisites

1. Supabase project with database access
2. Supabase Storage bucket for user documents
3. Embedding API key (OpenAI recommended, or use alternative)

## Setup Steps

### 1. Database Setup

Run the database migration to create the necessary tables:

```sql
-- Execute the SQL from db/schema_v4_sources.sql in your Supabase SQL editor
```

This creates:
- `user_sources` table: Stores metadata about uploaded documents
- `source_chunks` table: Stores text chunks with embeddings for semantic search

### 2. Supabase Storage Bucket

Create a storage bucket for user documents:

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket named `user-sources`
3. Set it to **Private** (users can only access their own files)
4. Add the following policy for authenticated users:

```sql
-- Policy: Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-sources' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-sources' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Environment Variables

Add the following to your `.env.local` file:

```env
# Required: For embedding generation (choose one)
OPENAI_API_KEY=your_openai_api_key_here

# OR if you prefer to use Google's embedding API (requires different setup)
# GEMINI_API_KEY=your_gemini_api_key_here  # Already set for chat

# Note: If neither is set, a fallback embedding method will be used
# (not recommended for production - use proper embedding API)
```

**Recommendation**: Use OpenAI's `text-embedding-3-small` model for best results and cost efficiency.

### 4. Install Dependencies

The required dependencies are already in `package.json`:
- `pdf-parse`: For PDF text extraction
- `mammoth`: For DOCX text extraction

If not installed, run:
```bash
npm install
```

### 5. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Upload a test document (PDF, DOCX, or TXT) through the UI
3. Ask a question related to the document content
4. The AI should reference information from your uploaded document

## How It Works

1. **Upload**: User uploads a document → File stored in Supabase Storage
2. **Processing**: 
   - Text extracted from document (PDF/DOCX/TXT)
   - Text split into chunks (~1000 characters each)
   - Each chunk embedded using embedding API
   - Chunks stored in database with embeddings
3. **Query**: 
   - User asks a question
   - Query embedded
   - Semantic search finds top 5 most relevant chunks
   - Relevant chunks passed as context to AI
   - AI generates response using both general knowledge and user's documents

## Supported File Types

- **PDF** (.pdf) - Using pdf-parse
- **DOCX** (.docx) - Using mammoth
- **TXT** (.txt) - Direct text reading
- **Note**: Old .doc format is not supported (convert to DOCX first)

## File Size Limits

- Maximum file size: 10MB
- Recommended: Keep documents under 5MB for faster processing

## Troubleshooting

### "Failed to parse PDF/DOCX"
- Ensure the file is not corrupted
- Try converting to a different format
- Check file size (very large files may timeout)

### "No relevant sources found"
- The query might not match any content in your documents
- Try rephrasing your question
- Ensure documents were processed successfully (check console logs)

### "Embedding generation failed"
- Check your API key is set correctly
- Verify API quota/limits
- Check network connectivity

### Storage upload errors
- Verify storage bucket exists and is named `user-sources`
- Check storage policies are set correctly
- Ensure user is authenticated

## Performance Notes

- Embedding generation can take a few seconds per document
- Large documents are split into multiple chunks
- Semantic search is fast (milliseconds) once embeddings are stored
- Only relevant chunks are retrieved (not entire documents)

## Future Enhancements

Potential improvements:
- Use Supabase's pgvector extension for native vector search (faster)
- Add support for more file types (images with OCR, etc.)
- Implement document versioning
- Add document preview in UI
- Batch processing for multiple documents




