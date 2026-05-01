package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Ai analysis response for single game records from a user
 * @param encouragementMessage main message to encourage with user-friendly language
 * @param analysis message about analysis of input data
 * @param strengths points of strength gathered by AI
 * @param powerUpTips points of recommendation gathered by AI
 */
public record AiAnalysisResponse(
        String encouragementMessage,
        String analysis,
        List<String> strengths,
        List<String> powerUpTips
) {
}
