package com.eduquest.springbackend.dto.rag;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * RAG query request dto
 * @param user_id
 * @param question
 * @param top_k
 * @param document_id
 */
public record RAGQueryRequest(
        Long user_id,

        @NotBlank
        String question,

        @NotNull
        @Min(1)
        @Max(20)
        Integer top_k,

        Integer document_id
) {
}
