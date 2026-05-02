package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * Minimal user game score DTO
 * @param name
 * @param scores
 * @param metadata
 * @param createdAt
 */
public record UserGameScoreMini(
        String name,
        Integer scores,
        GameMetadata metadata,
        Instant createdAt
) {
}
