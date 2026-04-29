package com.eduquest.springbackend.dto;

import java.time.Instant;

public record CourseGameScoreMini(
        String username,
        String gameName,
        Integer scores,
        GameMetadata metadata,
        Instant createdAt
) {
}
