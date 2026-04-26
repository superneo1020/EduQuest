package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    @Value("classpath:/prompts/game-analysis.st")
    private Resource analysisPromptResource;

    private final List<String> fieldLibrary = List.of(
            "\"encouragementMessage\": Two sentences: praise an achievement from 'achievements' and motivate for tomorrow.",
            "\"analysis\": Summary: most played category, highest score, and improvement area.",
            "\"strengths\": Bullet points on question types correctly answered in 'achievements'.",
            "\"powerUpTips\": Use the 'Description' of the games the student failed in 'challenges' to provide 2 specific pedagogical tips.",
            "\"gamesForNextSteps\": Recommend a game where the 'Core Skill' matches the student's weakest area in 'challenges', and explain why based on its 'Description'."
    );

    private final ChatClient chatClient;
    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiAnalysisService(
            ChatClient.Builder builder,
            UserGameScoreRepository userGameScoreRepo,
            UserRepository userRepo,
            GameRepository gameRepo
    ) {
        String games = gameRepo.findAllGameRecords().stream()
                .map(g -> String.format(
                        "- %s: [Category: %s] [Description: %s]",
                        g.name(),
                        g.type(),
                        g.description()
                ))
                .collect(Collectors.joining(", "));

        String fullSystemPrompt = """
            You are an encouraging, friendly AI mentor of EduQuest for primary school students.
            Your goal is to make students feel proud of their progress.
            Always use simple language and a growth-mindset tone.
            
            Current available games for reference: %s
            """.formatted(games);

        this.chatClient = builder
                .defaultSystem(fullSystemPrompt)
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .build();
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
    }

    public AiAnalysisResponse analyzeGame(Long gameId, Long userId, Pageable pageable) {
        // Calculate time context
        Instant now = Instant.now();
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow(
                () -> new RuntimeException("User not found"));
        long daysSinceJoined = ChronoUnit.DAYS.between(studentCreatedAt, now);

        // Get user game scores
        var userGameScores = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, pageable);
        var formattedLeanData = simplifyForAi(userGameScores.getContent());

        // Build request
        PromptTemplate userTemplate = new PromptTemplate(analysisPromptResource);
        Message userMessage = userTemplate.createMessage(Map.of(
                "intro", "daily progress",
                "data", formattedLeanData,
                "instructions", buildInstructions(0, 1, 2, 3),
                "daysSinceJoined", daysSinceJoined,
                "now", now
        ));

        try {
            return chatClient.prompt(new Prompt(userMessage))
                    .options(ChatOptions.builder().temperature(0.7).maxTokens(1500).build())
                    .call()
                    .entity(AiAnalysisResponse.class);
        } catch (Exception e) {
            return new AiAnalysisResponse("Keep it up! You're the best explorer!", "Data Analysis Buddy is temporarily on break.", List.of(), List.of());
        }
    }

    public AiOverallResponse analyzeGameOverall(Long userId, Pageable pageable) {
        Instant now = Instant.now();
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow(
                () -> new RuntimeException("User not found"));
        long daysSinceJoined = ChronoUnit.DAYS.between(studentCreatedAt, now);
        Instant twentyFourHoursAgo = Instant.now().minus(1, ChronoUnit.DAYS);

        var userGameScores = userGameScoreRepo.findUserGameScoresByUserIdAndCreatedAtAfter(userId, twentyFourHoursAgo, pageable);
        var formattedLeanData = simplifyForAi(userGameScores.getContent());

        // Build request
        PromptTemplate userTemplate = new PromptTemplate(analysisPromptResource);
        Message userMessage = userTemplate.createMessage(Map.of(
                "intro", "daily progress",
                "data", formattedLeanData,
                "instructions", buildInstructions(0, 1, 2, 3, 4),
                "daysSinceJoined", daysSinceJoined,
                "now", now
        ));

        try {
            return chatClient.prompt(new Prompt(userMessage))
                    .options(ChatOptions.builder().temperature(0.7).maxTokens(1500).build())
                    .call()
                    .entity(AiOverallResponse.class);
        } catch (Exception e) {
            return new AiOverallResponse("Keep it up! You're the best explorer!", "Data Analysis Buddy is temporarily on break.", List.of(), List.of(), "");
        }
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

    private String simplifyForAi(List<UserGameScoreDto> originalList) {
        List<GameLeanScore> leanData = originalList.stream().map(dto -> {
            // 1. Extract the words from the correct answers (for praise).
            List<String> achievements = dto.metadata().questions().stream()
                    .filter(GameQuestionRecord::isCorrect)
                    .map(GameQuestionRecord::content) // just content
                    .toList();

            // 2. Extract records of incorrect answers (for suggestion purposes).
            List<String> challenges = dto.metadata().questions().stream()
                    .filter(q -> !q.isCorrect())
                    .map(q -> String.format("Q: %s, My Ans: %s", q.content(), q.userAnswer()))
                    .toList();

            return new GameLeanScore(
                    dto.scores(),
                    dto.difficulty(),
                    achievements,
                    challenges,
                    dto.createdAt().toString().substring(0, 10)
            );
        }).collect(Collectors.toList());

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
}
