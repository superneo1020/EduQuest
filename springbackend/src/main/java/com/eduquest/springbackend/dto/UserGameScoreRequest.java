package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UserGameScoreRequest(
        @NotNull(message = "Game Name is required")
        String gameName,
        
        @NotNull(message = "Score is required")
        @Min(value = 0, message = "Score must be at least 0")
        Integer scores
) {
}
