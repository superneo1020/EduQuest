package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * Minimal user game score DTO for course
 * @param username
 * @param gameName
 * @param scores
 * @param metadata
 * @param createdAt
 */
public record CourseGameScoreMini(
        String username,
        String gameName,
        Integer scores,
        GameMetadata metadata,
        Instant createdAt
) {
}
