package com.eduquest.springbackend.dto;

import java.util.List;
import java.util.Map;

public record GameMetadata(
        List<GameQuestionRecord> questions, // Every game has questions
        Map<String, Object> extraData // Store everything else here (totalTime, caughtAnimals, etc.)
) {}
