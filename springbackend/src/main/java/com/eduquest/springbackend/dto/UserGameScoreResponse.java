package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User game score response
 * @param id
 * @param scores
 * @param createdAt
 */
public record UserGameScoreResponse(
        Long id,
        Integer scores,
        Instant createdAt
) {
}
