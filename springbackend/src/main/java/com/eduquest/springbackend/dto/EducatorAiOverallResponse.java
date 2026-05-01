package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Educator AI overall response for recent game records to a user
 * @param overallAnalysis Briefly explanation for all students from analysis
 * @param studentAnalysis points of analysis for each student gathered by AI
 */
public record EducatorAiOverallResponse(
        String overallAnalysis,
        List<String> studentAnalysis
) {
}
