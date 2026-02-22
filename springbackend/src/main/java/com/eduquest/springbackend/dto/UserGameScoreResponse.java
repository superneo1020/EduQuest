package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.model.type.GameType;

import java.time.Instant;

public record UserGameScoreResponse(
        Long userGameScoreId,
        Long userId,
        Long gameId,
        GameType gameType,
        String gameDifficulty,
        Integer scores,
        Instant createdAt,
        Integer userPoints
) {
}
