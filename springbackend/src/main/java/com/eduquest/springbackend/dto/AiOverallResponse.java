package com.eduquest.springbackend.dto;

import java.util.List;

public record AiOverallResponse(
        String encouragementMessage,
        String analysis,
        List<String> strengths,
        List<String> powerUpTips,
        String gamesForNextSteps
) {
}
