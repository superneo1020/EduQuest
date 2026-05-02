package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.FastAPIAnalysisRequest;
import com.eduquest.springbackend.dto.rag.RAGUploadResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class ExternalAiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
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

    /*
    * General POST a RAG request with user_id: Send after combining the Record object with the userId.
    */
    public <T> Mono<T> postRagRequestWithUserId(String endpoint, Object request, Class<T> responseType, Long userId) {
        // Create a wrapper object that includes user_id
        Map<String, Object> body = objectMapper.convertValue(request, new TypeReference<>() {});
        body.put("user_id", userId);

        return this.webClient.post()
                .uri(endpoint)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .doOnNext(result -> logger.info("FastAPI successfully processed POST request for RAG: {}", result))
                .doOnError(error -> {
                    if (error instanceof WebClientResponseException ex) {
                        logger.error("FastAPI POST error: {} - Response body: {}", ex.getMessage(), ex.getResponseBodyAsString());
                    } else {
                        logger.error("FastAPI POST error: {}", error.getMessage());
                    }
                });
    }

    /*
     * General GET a RAG request with user_id: Send after combining the Record object with the userId.
     */
    public <T> Mono<T> getRagRequestWithUserId(String endpoint, Class<T> responseType, Long userId) {
        return this.webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(endpoint)
                        .queryParam("user_id", userId)
                        .build())
                .retrieve()
                .bodyToMono(responseType)
                .doOnNext(result -> logger.info("FastAPI successfully processed GET request for RAG: {}", result))
                .doOnError(error -> {
                    if (error instanceof WebClientResponseException ex) {
                        logger.error("FastAPI GET error: {} - Response body: {}", ex.getMessage(), ex.getResponseBodyAsString());
                    } else {
                        logger.error("FastAPI GET error: {}", error.getMessage());
                    }
                });
    }

    /*
    * Upload a file to FastAPI with user_id, display_name, and file.
    */
    public Mono<RAGUploadResponse> uploadFileToFastApi(Long userId, MultipartFile file, String displayName) {
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        formData.add("display_name", displayName);
        formData.add("file", file.getResource());

        return this.webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/rag/upload-file")
                        .queryParam("user_id", userId)
                        .build())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .bodyValue(formData)
                .retrieve()
                .bodyToMono(RAGUploadResponse.class)
                .doOnError(error -> {
                    if (error instanceof WebClientResponseException ex) {
                        logger.error("FastAPI upload error: {} - Response body: {}", ex.getMessage(), ex.getResponseBodyAsString());
                    } else {
                        logger.error("FastAPI upload error: {}", error.getMessage());
                    }
                });
    }
}
