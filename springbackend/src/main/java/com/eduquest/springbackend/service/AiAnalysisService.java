package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.AiAnalysisRequest;
import com.eduquest.springbackend.dto.AiAnalysisResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AiAnalysisService {

    private final ChatClient chatClient;
    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final DtoMapper dtoMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiAnalysisService(ChatClient.Builder builder,
                             UserGameScoreRepository userGameScoreRepo,
                             UserRepository userRepo, DtoMapper dtoMapper) {
        this.chatClient = builder.defaultSystem("You are a professional game analyst. Provide friendly, clear, and supportive feedback in JSON format.").build();
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.dtoMapper = dtoMapper;
    }

    public AiAnalysisResponse analyzeGame(Long gameId, Long userId, Pageable pageable) {
        Instant now = Instant.now();
        Instant studentCreatedAt = userRepo.findCreatedAtById(userId).orElseThrow(
                () -> new RuntimeException("User not found"));
        var gameMetadata = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, pageable);
        var page = dtoMapper.toPageResponse(gameMetadata);
        var request = new AiAnalysisRequest(now, studentCreatedAt, page);
        String prompt = "The requester is a primary student who is looking analysis for one type of game history. " +
                "Please analyze the following JSON content and suggest with structured data in JSON format: " + request;
        return chatClient.prompt().user(prompt).call().entity(AiAnalysisResponse.class);
    }
}
