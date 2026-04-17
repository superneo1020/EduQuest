package com.eduquest.springbackend.dto;

import java.time.Instant;
import java.util.List;

public record AiOverallRequest(
        Instant requestTime,
        Instant studentCreatedAt,
        List<UserGameScoreDto> gameMetadata
) {
}
