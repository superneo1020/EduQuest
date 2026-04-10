package com.eduquest.springbackend.dto;

import java.time.Instant;
import java.util.Map;

public record UserGameScoreDto(
        String name,
        String type,
        String difficulty,
        String icon,
        String description,
        Integer scores,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
