package com.eduquest.springbackend.dto;

import java.time.Instant;

public record AiAnalysisRequest(
        Instant requestTime,
        Instant studentCreatedAt,
        UtilPageResponse<UserGameScoreDto> gameMetadata
) {
}
