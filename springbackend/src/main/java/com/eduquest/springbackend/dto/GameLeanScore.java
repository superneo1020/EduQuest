package com.eduquest.springbackend.dto;

import java.util.List;

public record GameLeanScore(
        int score,
        String difficulty,
        List<String> achievements, // correct answers
        List<String> challenges, // wrong answers
        String date
) {
}
