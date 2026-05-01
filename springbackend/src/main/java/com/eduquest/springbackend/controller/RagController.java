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

    @PostMapping("/query")
    public Mono<RAGQueryResponse> queryRag(
            @Valid @RequestBody RAGQueryRequest query,
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.postRagRequestWithUserId("/rag/query", query, RAGQueryResponse.class, userDetails.getId());
    }

    @PostMapping("/delete")
    public Mono<RAGDeleteResponse> deleteRag(
            @Valid @RequestBody RAGDeleteRequest query,
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.postRagRequestWithUserId("/rag/delete", query, RAGDeleteResponse.class, userDetails.getId());
    }

    @GetMapping("/documents")
    public Mono<RAGListResponse> documentsRag(
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return externalAiService.getRagRequestWithUserId("/rag/documents", RAGListResponse.class, userDetails.getId());
    }

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
