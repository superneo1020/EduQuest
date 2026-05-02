package com.eduquest.springbackend.dto.rag;

/**
 * RAG upload response dto
 * @param user_id
 * @param document_id
 * @param document_name
 * @param source_uri
 * @param file_type
 * @param total_pages
 * @param chunks_uploaded
 * @param status
 */
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
