// API endpoint for managing user sources (list, upload, delete)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../utils/supabase/server";
import { extractTextFromFile, chunkText, generateEmbedding } from "../../../services/documentProcessor";

// GET: List all sources for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sources, error } = await supabase
      .from("user_sources")
      .select("id, title, file_name, file_type, file_url, file_size, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sources:", error);
      return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
    }

    return NextResponse.json({ sources: sources || [] });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upload a new source
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || file.name;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    const allowedTypes = ['PDF', 'DOCX', 'DOC', 'TXT', 'TEXT'];
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Upload file to Supabase Storage
    // Use timestamp to ensure unique filename, allowing re-uploads of the same file
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    // Determine content type based on file extension if not provided
    let contentType = file.type;
    if (!contentType) {
      const ext = fileExtension.toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        'txt': 'text/plain',
        'text': 'text/plain',
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
      };
      contentType = mimeTypes[ext] || 'application/octet-stream';
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-sources")
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Provide more specific error message
      let errorMessage = "Failed to upload file";
      if (uploadError.message) {
        errorMessage = uploadError.message;
      }
      
      // Check for common issues
      if (errorMessage.includes("Bucket not found") || errorMessage.includes("does not exist")) {
        errorMessage = "Storage bucket 'user-sources' not found. Please create it in Supabase Storage.";
      } else if (errorMessage.includes("permission") || errorMessage.includes("access")) {
        errorMessage = "Permission denied. Please check storage bucket permissions.";
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("user-sources")
      .getPublicUrl(fileName);

    // Save source metadata to database
    const { data: sourceData, error: sourceError } = await supabase
      .from("user_sources")
      .insert({
        user_id: user.id,
        title: title,
        file_name: file.name,
        file_type: fileExtension,
        file_url: publicUrl,
        file_size: file.size
      })
      .select()
      .single();

    if (sourceError) {
      console.error("Error saving source:", sourceError);
      // Try to delete uploaded file
      await supabase.storage.from("user-sources").remove([fileName]);
      return NextResponse.json({ error: "Failed to save source" }, { status: 500 });
    }

    // Process document: extract text, chunk, and generate embeddings
    try {
      // Extract text from file
      // Note: For .txt files, we need to recreate the File object from the buffer
      // since we already read it as arrayBuffer for storage upload
      let text: string;
      if (fileExtension === 'TXT' || fileExtension === 'TEXT') {
        // For text files, read directly from the buffer we already have
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(fileBuffer);
      } else {
        // For other file types, use the extractTextFromFile function
        // We need to recreate a File-like object from the buffer
        const blob = new Blob([fileBuffer], { type: contentType });
        const fileFromBuffer = new File([blob], file.name, { type: contentType });
        text = await extractTextFromFile(fileFromBuffer, fileExtension);
      }
      
      if (!text || text.trim().length === 0) {
        console.warn("Extracted text is empty");
        // Don't fail - just skip processing
        return NextResponse.json({ 
          source: sourceData,
          message: "Source uploaded successfully (processing skipped - empty file)" 
        });
      }
      
      // Chunk the text
      const chunks = chunkText(text);
      
      if (chunks.length === 0) {
        console.warn("No chunks created from text");
        return NextResponse.json({ 
          source: sourceData,
          message: "Source uploaded successfully (processing skipped - no content)" 
        });
      }
      
      // Generate embeddings for each chunk and save to database
      const chunkPromises = chunks.map(async (chunkText, index) => {
        try {
          const embedding = await generateEmbedding(chunkText);
          
          const { error: insertError } = await supabase
            .from("source_chunks")
            .insert({
              source_id: sourceData.id,
              chunk_text: chunkText, // Use 'chunk_text' to match actual database column
              chunk_index: index,
              embedding: embedding,
              metadata: {
                total_chunks: chunks.length,
                chunk_size: chunkText.length
              }
            });
          
          if (insertError) {
            console.error(`Error inserting chunk ${index}:`, insertError);
            // If chunk_text doesn't exist, try content
            if (insertError.code === '42703' && insertError.message?.includes('chunk_text')) {
              console.log('Trying with content column instead');
              const { error: retryError } = await supabase
                .from("source_chunks")
                .insert({
                  source_id: sourceData.id,
                  content: chunkText,
                  chunk_index: index,
                  embedding: embedding,
                  metadata: {
                    total_chunks: chunks.length,
                    chunk_size: chunkText.length
                  }
                });
              if (retryError) {
                console.error(`Error inserting chunk ${index} with content column:`, retryError);
              }
            }
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${index}:`, chunkError);
        }
      });

      await Promise.all(chunkPromises);
      console.log(`Successfully processed ${chunks.length} chunks for source ${sourceData.id}`);
      
    } catch (processingError: any) {
      console.error("Error processing document:", processingError);
      // Don't fail the upload if processing fails - user can still see the file
      // But log the error for debugging
      console.warn("Document processing failed, but file was uploaded:", processingError.message);
    }

    return NextResponse.json({ 
      source: sourceData,
      message: "Source uploaded successfully" 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a source
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("id");

    if (!sourceId) {
      return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: source, error: fetchError } = await supabase
      .from("user_sources")
      .select("file_url")
      .eq("id", sourceId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Delete file from storage (if exists)
    if (source.file_url) {
      // Extract file path from URL
      const urlParts = source.file_url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Get user_id/filename
      await supabase.storage.from("user-sources").remove([fileName]);
    }

    // Delete chunks first (explicitly, though cascade should handle it)
    const { error: chunksDeleteError } = await supabase
      .from("source_chunks")
      .delete()
      .eq("source_id", sourceId);
    
    if (chunksDeleteError) {
      console.error("Error deleting source chunks:", chunksDeleteError);
      // Continue with source deletion even if chunk deletion fails
    }

    // Delete source (cascade will also handle chunks, but we deleted them explicitly above)
    const { error: deleteError } = await supabase
      .from("user_sources")
      .delete()
      .eq("id", sourceId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting source:", deleteError);
      return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
    }

    return NextResponse.json({ message: "Source deleted successfully" });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


