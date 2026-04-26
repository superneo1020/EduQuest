package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.AiAnalysisRequest;
import com.eduquest.springbackend.dto.AiAnalysisResponse;
import com.eduquest.springbackend.dto.AiOverallRequest;
import com.eduquest.springbackend.dto.AiOverallResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    private final List<String> fieldLibrary = List.of(
            "\"encouragementMessage\": Two sentences: one praising a specific achievement and one motivating them for tomorrow.",
            "\"analysis\": A three-part summary: identify their most played category, their highest score, and their biggest improvement area.",
            "\"strengths\": Two bullet points describing *how* they succeeded (e.g., 'Your speed in Math is increasing').",
            "\"powerUpTips\": Two actionable tips based on their actual mistakes (e.g., 'Slow down on the long sentences in Chinese').",
            "\"gamesForNextSteps\": One recommendation explaining *why* it fits their current skill level."
    );

    private final String NEXT_STEPS_FIELD = "5. \"gamesForNextSteps\": One short recommendation from the game catalog.";

    private final ChatClient chatClient;
    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final DtoMapper dtoMapper;

    public AiAnalysisService(ChatClient.Builder builder,
                             UserGameScoreRepository userGameScoreRepo,
                             UserRepository userRepo,
                             GameRepository gameRepo,
                             DtoMapper dtoMapper) {
        var games = gameRepo.findAllGameRecords().stream()
                .map(g -> String.format("- %s (Type: %s, Difficulty: %s, Description: %s)",
                        g.name(), g.type(), g.difficulty(), g.description()
                ))
                .collect(Collectors.joining("\n"));
        this.chatClient = builder
                .defaultSystem("You are an encouraging, friendly AI mentor of EduQuest for " +
                        "primary school students. Your goal is to make students feel proud of " +
                        "their progress, even if they fail. Use simple language, plenty of positive " +
                        "reinforcement, and a growth-mindset tone. Always provide feedback in " +
                        "structured JSON format. Available games: %s".formatted(games)).build();
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.dtoMapper = dtoMapper;
    }

    public AiAnalysisResponse analyzeGame(Long gameId, Long userId, Pageable pageable) {
        Instant now = Instant.now();
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow(
                () -> new RuntimeException("User not found"));
        var userGameScores = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, pageable);
        var page = dtoMapper.toPageResponse(userGameScores);
        var request = new AiAnalysisRequest(now, studentCreatedAt, page);
        String prompt = buildPrompt("history for one specific game", request, buildInstructions(0, 1, 2, 3));
        return chatClient.prompt()
                .user(prompt)
                .options(ChatOptions.builder().temperature(0.7).maxTokens(1000).build())
                .call()
                .entity(AiAnalysisResponse.class);
    }

    public AiOverallResponse analyzeGameOverall(Long userId) {
        Instant now = Instant.now();
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow(
                () -> new RuntimeException("User not found"));
        Instant twentyFourHoursAgo = Instant.now().minus(1, ChronoUnit.DAYS);
        var userGameScores = userGameScoreRepo.findUserGameScoresByUserIdAndCreatedAtAfter(userId, twentyFourHoursAgo);
        var request = new AiOverallRequest(now, studentCreatedAt, userGameScores);
        String prompt = buildPrompt("game history for today", request, buildInstructions(0, 1, 2, 3, 4));
        return chatClient.prompt()
                .user(prompt)
                .options(ChatOptions.builder().temperature(0.7).maxTokens(1000).build())
                .call()
                .entity(AiOverallResponse.class);
    }

    private String buildPrompt(String intro, Record data, String instructions) {
        return String.format("""
                Analyze this primary student's %s: %s \s
                Please generate a supportive response with the following JSON fields: %s \s
                Tone Rule: Use 'Growth Mindset' language. Use words like 'Explorer', 'Champion', and 'Brilliant'. \s
                Critical: Keep the total response short so the JSON does not get cut off!
                """, intro, data, instructions);
    }

    private String buildInstructions(int... indices) {
        StringBuilder sb = new StringBuilder("Please return a JSON object with these fields:\n");
        for (int i = 0; i < indices.length; i++) {
            int fieldIndex = indices[i];
            if (fieldIndex >= 0 && fieldIndex < fieldLibrary.size()) {
                sb.append(String.format("%d. %s\n", i + 1, fieldLibrary.get(fieldIndex)));
            }
        }
        return sb.toString();
    }
}
