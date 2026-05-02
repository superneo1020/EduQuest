package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User game score dto for leaderboard
 * @param username
 * @param scores
 * @param createdAt
 */
public record LeaderboardScoreDto(
        String username,
        Integer scores,
        Instant createdAt
) {
}
