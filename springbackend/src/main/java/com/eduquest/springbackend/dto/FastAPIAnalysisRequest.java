package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * FastAPI analysis request for recent game records from a user
 * @param sessionId
 * @param userId
 * @param gameHistory
 * @param studentProfile
 */
public record FastAPIAnalysisRequest(
        String sessionId,
        Long userId,
        List<GameLeanScore> gameHistory,
        String studentProfile
) {
}
