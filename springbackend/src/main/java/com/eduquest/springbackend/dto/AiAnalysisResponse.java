package com.eduquest.springbackend.dto;

import java.util.List;

public record AiAnalysisResponse(
        String encouragementMessage,
        String analysis,
        List<String> strengths,
        List<String> powerUpTips
) {
}
