package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    @Value("classpath:/prompts/game-analysis.st")
    private Resource analysisPromptResource;

    private final List<String> fieldLibrary = List.of(
            "\"encouragementMessage\": Two sentences. If 'achievements' has items, praise a specific one. If empty, praise their high scores or effort, and motivate for tomorrow.",
            "\"analysis\": Summary: most played category (based on gameCategory), highest score, and one general improvement area.",
            "\"strengths\": Bullet points on question types correctly answered in 'achievements'. If empty, list general strengths based on their high scores.",
            "\"powerUpTips\": If 'challenges' has items, use the 'Description' of those failed games to provide 2 specific pedagogical tips. If empty, provide 2 general tips to keep up the good work.",
            "\"gamesForNextSteps\": Recommend a game from the 'available games' list where the 'Core Skill' matches the student's weakest area or expands their current skills. Explain why based on its 'Description'."
    );

    private ChatClient chatClient;
    private final ChatClient.Builder chatClientBuilder;
    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExternalAiService externalAiService;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public AiAnalysisService(
            ChatClient.Builder chatClientBuilder,
            UserGameScoreRepository userGameScoreRepo,
            UserRepository userRepo,
            GameRepository gameRepo,
            ExternalAiService externalAiService
    ) {
        this.chatClientBuilder = chatClientBuilder;
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.gameRepo = gameRepo;
        this.externalAiService = externalAiService;
    }

    @PostConstruct
    public void initGameLibrary() {
        // Build games list
        String games = gameRepo.findAllGameRecords().stream()
                .map(g -> String.format(
                        "- %s: [Category: %s] [Description: %s]",
                        g.name(),
                        g.type(),
                        g.description()
                ))
                .collect(Collectors.joining(", "));

        // Build full system prompt
        String fullSystemPrompt = """
            You are an encouraging, friendly AI mentor of EduQuest for primary school students.
            Your goal is to make students feel proud of their progress.
            Always use simple language and a growth-mindset tone.
            
            Current available games for reference: %s
            """.formatted(games);

        this.chatClient = chatClientBuilder
                .defaultSystem(fullSystemPrompt)
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .build();

        logger.info("AiAnalysisService: Game library context cached successfully!");
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
                "intro", "process for a specific game",
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

    public AiOverallResponse analyzeGameDaily(Long userId, Pageable pageable) {
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

    public void prepareAndSendToFastApi(Long userId, Long gameId, Pageable pageable) {
        // Calculate time context
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow();
        long daysJoined = ChronoUnit.DAYS.between(studentCreatedAt, Instant.now());
        String profile = String.format("Joined for %d days.", daysJoined);

        // Get user game scores (no need formatting)
        var userGameScores = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, pageable);
        List<GameLeanScore> leanData = getLeanData(userGameScores.getContent());

        // format request
        String sessionId = UUID.randomUUID().toString();
        FastAPIAnalysisRequest request = new FastAPIAnalysisRequest(sessionId, userId, leanData, profile);

        // call to fastapi
        externalAiService.postAnalysisRequest(request);
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
        List<GameLeanScore> leanData = getLeanData(originalList);

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

    private List<GameLeanScore> getLeanData(List<UserGameScoreDto> originalList) {
        return originalList.stream().map(dto -> {
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

            if (achievements.isEmpty()) {
                achievements = List.of("No correct answers found.");
            }

            if (challenges.isEmpty()) {
                challenges = List.of("Perfect session! No challenges found.");
            }

            String gameName = dto.name();

            return new GameLeanScore(
                    gameName,
                    dto.scores(),
                    dto.difficulty(),
                    achievements,
                    challenges,
                    dto.createdAt().toString().substring(0, 10)
            );
        }).collect(Collectors.toList());
    }
}
