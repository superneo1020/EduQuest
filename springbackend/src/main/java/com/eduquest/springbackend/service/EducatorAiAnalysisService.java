package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dto.EducatorAiAnalysisResponse;
import com.eduquest.springbackend.dto.EducatorAiOverallResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@PreAuthorize("hasRole('EDUCATOR')")
public class EducatorAiAnalysisService {

    @Value("classpath:/prompts/game-analysis-educator.st")
    private Resource analysisPromptResource;

    private final List<String> fieldLibrary = List.of(
            "\"overallAnalysis\": Summary: most played 'Category', highest score, and one general improvement area.",
            "\"studentAnalysis\": Student's performance summary and suggestions based on their top 3 achievements and top 3 challenges at most.",
            "\"strengths\": List of strengths based on student's achievements.",
            "\"weaknesses\": List of weaknesses based on student's challenges.",
            "\"suggestions\": List of suggestions for improvement based on student's weaknesses."
    );

    private ChatClient chatClient;
    private final ChatClient.Builder chatClientBuilder;
    private final UserGameScoreRepository userGameScoreRepo;
    private final GameRepository gameRepo;
    private final PromptSerializer promptSerializer;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public EducatorAiAnalysisService(
            ChatClient.Builder chatClientBuilder,
            UserGameScoreRepository userGameScoreRepo,
            GameRepository gameRepo,
            PromptSerializer promptSerializer
    ) {
        this.chatClientBuilder = chatClientBuilder;
        this.userGameScoreRepo = userGameScoreRepo;
        this.gameRepo = gameRepo;
        this.promptSerializer = promptSerializer;
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
            You are a Professional analyzer of EduQuest for primary school students.
            Your goal is to help educators analyze their students progress in EduQuest.
            Focus on student's weakness and strengths, and provide suggestions for improvement.
            
            Current Available Games for reference: %s
            """.formatted(games);

        this.chatClient = chatClientBuilder
                .defaultSystem(fullSystemPrompt)
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .build();

        logger.info("EducatorAiAnalysisService: Game library context cached successfully!");
    }

    public EducatorAiAnalysisResponse analyzeStudentGameProgress(Long userId, Long gameId, Pageable pageable) {
        // Get user game scores
        var userGameScores = userGameScoreRepo.findGameRecordMiniByUserIdAndGameId(userId, gameId, pageable);
        var formattedLeanData = promptSerializer.simplifyForAi(userGameScores.getContent());

        // Build request
        PromptTemplate userTemplate = new PromptTemplate(analysisPromptResource);
        Message userMessage = userTemplate.createMessage(Map.of(
                "intro", "a student's process for a specific game",
                "data", formattedLeanData,
                "instructions", promptSerializer.buildInstructions(fieldLibrary,0, 2, 3, 4)
        ));

        try {
            return chatClient.prompt(new Prompt(userMessage))
                    .options(ChatOptions.builder().temperature(0.7).maxTokens(1500).build())
                    .call()
                    .entity(EducatorAiAnalysisResponse.class);
        } catch (Exception e) {
            return new EducatorAiAnalysisResponse("We encountered an unexpected error while processing your ai analysis request. Please refresh the page or try again in a few minutes.", List.of(), List.of(), List.of());
        }
    }

    public EducatorAiOverallResponse analysisRecentProgress(Long courseId, Pageable pageable) {
        // Get user game scores
        var userGameScores = userGameScoreRepo.findAllUserGameScoresByCourseId(courseId, pageable);
        var formattedLeanData = promptSerializer.simplifyCourseDataForAi(userGameScores.getContent());

        // Build request
        PromptTemplate userTemplate = new PromptTemplate(analysisPromptResource);
        Message userMessage = userTemplate.createMessage(Map.of(
                "intro", "recent process for all students",
                "data", formattedLeanData,
                "instructions", promptSerializer.buildInstructions(fieldLibrary,0, 1)
        ));

        try {
            return chatClient.prompt(new Prompt(userMessage))
                    .options(ChatOptions.builder().temperature(0.7).maxTokens(1500).build())
                    .call()
                    .entity(EducatorAiOverallResponse.class);
        } catch (Exception e) {
            return new EducatorAiOverallResponse("We encountered an unexpected error while processing your ai analysis request. Please refresh the page or try again in a few minutes.", List.of());
        }
    }
}
