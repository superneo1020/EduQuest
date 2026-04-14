package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserGameScoreDto(
        String name,
        String type,
        String difficulty,
        String icon,
        String description,
        Integer scores,
        String metadata,
        Instant createdAt
) {
}
