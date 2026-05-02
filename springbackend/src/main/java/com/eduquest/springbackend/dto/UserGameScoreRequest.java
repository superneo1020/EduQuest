package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * User game score request
 * @param gameName The name of the game being added to records
 * @param scores The score of the user after playing the game
 * @param metadata The metadata of the game (e.g., time spent, user answer, etc.)
 */
public record UserGameScoreRequest(
        @NotBlank
        @Size(max = 50)
        String gameName,

        @NotNull
        @Min(value = 0)
        Integer scores,

        @NotNull
        GameMetadata metadata
) {
}
