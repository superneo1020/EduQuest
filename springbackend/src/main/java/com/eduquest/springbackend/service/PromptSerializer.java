package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromptSerializer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String buildInstructions(List<String> fieldLibrary, int... indices) {
        StringBuilder sb = new StringBuilder("Please return a JSON object with these fields:\n");
        for (int i = 0; i < indices.length; i++) {
            int fieldIndex = indices[i];
            if (fieldIndex >= 0 && fieldIndex < fieldLibrary.size()) {
                sb.append(String.format("%d. %s\n", i + 1, fieldLibrary.get(fieldIndex)));
            }
        }
        return sb.toString();
    }

    public String simplifyForAi(List<UserGameScoreMini> originalList) {
        var leanData = getLeanData(originalList);

        String formattedLeanData;
        try {
            formattedLeanData = leanData.isEmpty()
                    ? "[{\"note\": \"No games played today yet. This is a fresh start!\"}]"
                    : objectMapper.writeValueAsString(leanData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return formattedLeanData;
    }

    public String simplifyCourseDataForAi(List<CourseGameScoreMini> originalList) {
        var leanData = getLeanDataForCourse(originalList);

        String formattedLeanData;
        try {
            formattedLeanData = leanData.isEmpty()
                    ? "[{\"note\": \"No games played today yet. This is a fresh start!\"}]"
                    : objectMapper.writeValueAsString(leanData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return formattedLeanData;
    }

    public List<GameLeanScore> getLeanData(List<UserGameScoreMini> originalList) {
        return originalList.stream().map(dto -> {
            // Extract the words from the correct answers (for praise).
            var summary = processQuestions(dto.metadata().questions());

            return new GameLeanScore(
                    dto.name(),
                    dto.scores(),
                    summary.achievements(),
                    summary.challenges(),
                    dto.createdAt().toString().substring(0, 10)
            );
        }).collect(Collectors.toList());
    }

    public List<CourseGameLeanScore> getLeanDataForCourse(List<CourseGameScoreMini> originalList) {
        return originalList.stream().map(dto -> {
            // Extract the words from the correct answers (for praise).
            var summary = processQuestions(dto.metadata().questions());

            return new CourseGameLeanScore(
                    dto.username(),
                    dto.gameName(),
                    dto.scores(),
                    summary.achievements(),
                    summary.challenges(),
                    dto.createdAt().toString().substring(0, 10)
            );
        }).collect(Collectors.toList());
    }

    private QuestionSummary processQuestions(List<GameQuestionRecord> questions) {
        var achievements = questions.stream()
                .filter(GameQuestionRecord::isCorrect)
                .map(GameQuestionRecord::content)
                .toList();

        var challenges = questions.stream()
                .filter(q -> !q.isCorrect())
                .map(q -> String.format("Q: %s, My Ans: %s", q.content(), q.userAnswer()))
                .toList();

        return new QuestionSummary(
                achievements.isEmpty() ? List.of("No correct answers found.") : achievements,
                challenges.isEmpty() ? List.of("Perfect session! No challenges found.") : challenges
        );
    }
}
