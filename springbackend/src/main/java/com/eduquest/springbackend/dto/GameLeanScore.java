package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Game lean score
 * @param gameName The name of the game to let AI identify
 * @param score The score of the user after playing the game
 * @param achievements The list of question that user is correctly answered
 * @param challenges The list of question and the user's answer that user is incorrectly answered
 * @param date The date of the gameplay
 */
public record GameLeanScore(
        String gameName,
        int score,
        List<String> achievements, // correct answers
        List<String> challenges, // wrong answers
        String date
) {
}
