package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserScoreDto(
        String username,
        Integer score,
        Instant createdAt
) {
}
