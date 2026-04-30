package com.eduquest.springbackend.dto.rag;

import jakarta.validation.constraints.NotBlank;

public record RAGDeleteRequest(
        Long user_id,

        @NotBlank
        String source_uri
) {
}
