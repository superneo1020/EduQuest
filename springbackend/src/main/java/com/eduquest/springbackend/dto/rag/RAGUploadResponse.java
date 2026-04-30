package com.eduquest.springbackend.dto.rag;

public record RAGUploadResponse(
        Long user_id,
        int document_id,
        String document_name,
        String source_uri,
        String file_type,
        int total_pages,
        int chunks_uploaded,
        String status
) {
}
