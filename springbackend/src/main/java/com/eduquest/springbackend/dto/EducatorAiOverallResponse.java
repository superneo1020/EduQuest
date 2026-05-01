package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Educator AI overall response for recent game records to a user
 * @param overallAnalysis
 * @param gameAnalysis
 */
public record EducatorAiOverallResponse(
        String overallAnalysis,
        List<String> gameAnalysis
) {
}
