package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.rag.*;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.ExternalAiService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/user/rag")
public class RagController {
    private final ExternalAiService externalAiService;

    public RagController(ExternalAiService externalAiService) {
        this.externalAiService = externalAiService;
    }

    /**
     * Queries the RAG (Retrieval-Augmented Generation) system with a user question.
     * Returns AI-generated answers based on the user's uploaded documents.
     */
    @PostMapping("/query")
    public Mono<RAGQueryResponse> queryRag(
            @Valid @RequestBody RAGQueryRequest query,
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.postRagRequestWithUserId("/rag/query", query, RAGQueryResponse.class, userDetails.getId());
    }

    /**
     * Deletes documents from the user's RAG knowledge base.
     * Removes specified documents from the AI's document collection.
     */
    @PostMapping("/delete")
    public Mono<RAGDeleteResponse> deleteRag(
            @Valid @RequestBody RAGDeleteRequest query,
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.postRagRequestWithUserId("/rag/delete", query, RAGDeleteResponse.class, userDetails.getId());
    }

    /**
     * Lists all documents in the user's RAG knowledge base.
     * Returns a catalog of uploaded documents available for querying.
     */
    @GetMapping("/documents")
    public Mono<RAGListResponse> documentsRag(
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.getRagRequestWithUserId("/rag/documents", RAGListResponse.class, userDetails.getId());
    }

    /**
     * Uploads a file to the user's RAG knowledge base.
     * Accepts various document formats for AI-powered search and retrieval.
     */
    @PostMapping(value = "/upload-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<RAGUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "display_name", required = false) String displayName,
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.uploadFileToFastApi(
                userDetails.getId(),
                file,
                displayName != null ? displayName : file.getOriginalFilename()
        );
    }
}
