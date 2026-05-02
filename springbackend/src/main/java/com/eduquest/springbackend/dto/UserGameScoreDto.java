package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User game score DTO
 * @param name
 * @param type
 * @param difficulty
 * @param icon
 * @param description
 * @param scores
 * @param metadata
 * @param createdAt
 */
public record UserGameScoreDto(
        String name,
        String type,
        String difficulty,
        String icon,
        String description,
        Integer scores,
        GameMetadata metadata,
        Instant createdAt
) {
}
