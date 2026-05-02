package com.eduquest.springbackend.dto.rag;

import java.util.List;
import java.util.Map;

/**
 * RAG list response dto
 * @param documents
 */
public record RAGListResponse(
        List<Map<String, Object>> documents
) {
}
