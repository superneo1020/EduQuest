package com.eduquest.springbackend.dto.rag;

import jakarta.validation.constraints.NotBlank;

/**
 * RAG upload request dto
 * @param user_id
 * @param file_path
 * @param display_name
 */
public record RAGUploadRequest(
        Long user_id,

        @NotBlank
        String file_path,

        String display_name
) {
}
