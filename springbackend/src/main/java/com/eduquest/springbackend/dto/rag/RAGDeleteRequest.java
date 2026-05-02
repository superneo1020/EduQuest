package com.eduquest.springbackend.dto.rag;

import jakarta.validation.constraints.NotBlank;

/**
 * RAG delete request dto
 * @param user_id
 * @param source_uri
 */
public record RAGDeleteRequest(
        Long user_id,

        @NotBlank
        String source_uri
) {
}
