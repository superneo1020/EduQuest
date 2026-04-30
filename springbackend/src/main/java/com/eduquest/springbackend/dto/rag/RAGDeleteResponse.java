package com.eduquest.springbackend.dto.rag;

public record RAGDeleteResponse(
        String status,
        Long user_id,
        Integer document_id,
        String source_uri
) {
}
