package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Ai analysis response for recent game records to a user
 * @param encouragementMessage main message to encourage with user-friendly language
 * @param analysis message about analysis of input data
 * @param strengths points of strength gathered by AI
 * @param powerUpTips points of recommendation (based on weaknesses) gathered by AI
 * @param gamesForNextSteps next games recommended for user to play
 */
public record AiOverallResponse(
        String encouragementMessage,
        String analysis,
        List<String> strengths,
        List<String> powerUpTips,
        String gamesForNextSteps
) {
}
