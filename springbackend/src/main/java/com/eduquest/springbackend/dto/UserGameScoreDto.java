package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserGameScoreDto(
        String gameName,
        String gameType,
        String gameDifficulty,
        String gameIcon,
        String gameDescription,
        Integer scores,
        Instant createdAt
) {
}
