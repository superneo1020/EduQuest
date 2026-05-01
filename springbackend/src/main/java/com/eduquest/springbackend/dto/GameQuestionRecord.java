package com.eduquest.springbackend.dto;

/**
 * Game question record in game metadata
 * @param id
 * @param content
 * @param questionType
 * @param userAnswer
 * @param correctAnswer
 * @param isCorrect
 * @param timeSpent
 */
public record GameQuestionRecord(
        Integer id,
        String content,
        String questionType,
        String userAnswer,
        String correctAnswer,
        Boolean isCorrect,
        Integer timeSpent
) {
}
