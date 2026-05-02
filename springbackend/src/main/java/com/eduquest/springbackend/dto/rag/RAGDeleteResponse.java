package com.eduquest.springbackend.dto.rag;

/**
 * RAG delete response dto
 * @param status
 * @param user_id
 * @param document_id
 * @param source_uri
 */
public record RAGDeleteResponse(
        String status,
        Long user_id,
        Integer document_id,
        String source_uri
) {
}
