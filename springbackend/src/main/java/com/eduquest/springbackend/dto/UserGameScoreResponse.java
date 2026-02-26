package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserGameScoreResponse(
        Long userGameScoreId,
        Long userId,
        Long gameId,
        String gameType,
        String gameDifficulty,
        Integer scores,
        Instant createdAt,
        Integer userPoints
) {
}
