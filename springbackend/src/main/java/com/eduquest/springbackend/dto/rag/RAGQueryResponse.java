package com.eduquest.springbackend.dto.rag;

import java.util.List;
import java.util.Map;

public record RAGQueryResponse(
        String answer,
        List<Map<String, Object>> contexts,
        List<String> sources,
        List<Integer> document_ids
) {
}
