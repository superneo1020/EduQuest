package com.eduquest.springbackend.dto;

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
