package com.eduquest.springbackend.dto;

import java.util.List;

public record FastAPIAnalysisRequest(
        String sessionId,
        Long userId,
        List<GameLeanScore> gameHistory,
        String studentProfile
) {
}
