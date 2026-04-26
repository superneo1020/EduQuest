package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.UserGameScoreDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class ExternalAiService {

    private final WebClient webClient;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public ExternalAiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    public Mono<String> sendDataToFastApi(UserGameScoreDto request) {
        return this.webClient.post()
                .uri("/ai/analyze-trends")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> logger.error("FastAPI Error: {}", e.getMessage()));
    }
}
