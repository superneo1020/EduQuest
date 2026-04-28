package com.eduquest.springbackend.dto;

import java.util.List;

public record QuestionSummary(
        List<String> achievements,
        List<String> challenges
) {
}
