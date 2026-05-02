package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Educator AI analysis response for single game records from a user
 * @param overallAnalysis Briefly explanation from analysis
 * @param strengths  points of strength gathered by AI
 * @param weaknesses points of weakness gathered by AI
 * @param emotions points of emotion gathered by AI
 * @param suggestions points of recommendation gathered by AI
 */
public record EducatorAiAnalysisResponse(
        String overallAnalysis,
        List<String> strengths,
        List<String> weaknesses,
        List<String> emotions,
        List<String> suggestions
) {
}
