package com.eduquest.springbackend.dto;

import java.util.List;

public record EducatorAiAnalysisResponse(
        String overallAnalysis,
        List<String> strengths,
        List<String> weaknesses,
        List<String> emotions,
        List<String> suggestions
) {
}
