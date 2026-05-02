package com.eduquest.springbackend.dto;

import java.util.List;
import java.util.Map;

/**
 * Game metadata
 * @param questions The common contents of the game questions (e.g., timeSpent, userAnswer, correctAnswer, etc.)
 * @param extraData The additional data of the game which are not common for all games (e.g., totalAttempts, caughtAnimals, etc.)
 */
public record GameMetadata(
        List<GameQuestionRecord> questions, // Every game has questions
        Map<String, Object> extraData // Store everything else here (totalTime, caughtAnimals, etc.)
) {}
