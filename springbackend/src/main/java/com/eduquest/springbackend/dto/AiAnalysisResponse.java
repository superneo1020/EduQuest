package com.eduquest.springbackend.dto;

import java.util.List;

public record AiAnalysisResponse(
        String analysis,   // or whatever fields you defined
        String suggestions,
        List<String> strengths
) {
}
