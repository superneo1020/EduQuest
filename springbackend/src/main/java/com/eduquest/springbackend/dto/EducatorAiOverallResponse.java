package com.eduquest.springbackend.dto;

import java.util.List;

public record EducatorAiOverallResponse(
        String overallAnalysis,
        List<String> studentAnalysis
) {
}
