package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.model.type.GameType;

import java.time.Instant;

public record GameScoreDto(
        String gameName,
        GameType gameType,
        String gameDifficulty,
        String gameIcon,
        String gameDescription,
        Integer scores,
        Instant createdAt
) {
}
