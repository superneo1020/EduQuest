package com.eduquest.springbackend.dto;

import java.time.Instant;

public record LeaderboardScoreDto(
        String username,
        Integer scores,
        Instant createdAt
) {
}
