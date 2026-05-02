package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Question summary dto from game lean score for AI analysis
 * @param achievements
 * @param challenges
 */
public record QuestionSummary(
        List<String> achievements,
        List<String> challenges
) {
}
