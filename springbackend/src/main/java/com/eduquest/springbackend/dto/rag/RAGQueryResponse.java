package com.eduquest.springbackend.dto.rag;

import java.util.List;
import java.util.Map;

/**
 * RAG query response dto
 * @param answer
 * @param contexts
 * @param sources
 * @param document_ids
 */
public record RAGQueryResponse(
        String answer,
        List<Map<String, Object>> contexts,
        List<String> sources,
        List<Integer> document_ids
) {
}
