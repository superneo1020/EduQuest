package com.eduquest.springbackend.dto.rag;

import jakarta.validation.constraints.NotBlank;

public record RAGUploadRequest(
        Long user_id,

        @NotBlank
        String file_path,

        String display_name
) {
}
