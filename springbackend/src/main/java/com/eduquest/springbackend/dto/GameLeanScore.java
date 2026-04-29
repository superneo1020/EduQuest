package com.eduquest.springbackend.dto;

import java.util.List;

public record GameLeanScore(
        String gameName,
        int score,
        List<String> achievements, // correct answers
        List<String> challenges, // wrong answers
        String date
) {
}
