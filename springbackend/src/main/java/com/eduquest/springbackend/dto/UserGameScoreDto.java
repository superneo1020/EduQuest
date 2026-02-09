package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.model.type.DifficultyType;
import com.eduquest.springbackend.model.type.GameType;
import java.time.Instant;

public record UserGameScoreDto(
        String gameName,
        GameType gameType,
        DifficultyType gameDifficulty,
        String gameIcon,
        String gameDescription,
        Integer scores,
        Instant createdAt
) {
}
