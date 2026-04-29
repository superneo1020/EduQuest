package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.FastAPIAnalysisRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ExternalAiService {

    private final WebClient webClient;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public ExternalAiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    public void postAnalysisRequest(FastAPIAnalysisRequest request) {
        this.webClient.post()
                .uri("/ai/analyze-trends")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .subscribe(
                        result -> logger.info("FastAPI successfully processed: {}", result),
                        error -> logger.error("Failed to reach FastAPI: {}", error.getMessage())
                );
    }
}
