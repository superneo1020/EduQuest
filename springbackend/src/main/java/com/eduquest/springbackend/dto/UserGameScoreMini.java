package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserGameScoreMini(
        String name,
        Integer scores,
        GameMetadata metadata,
        Instant createdAt
) {

}
