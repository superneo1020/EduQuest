package com.eduquest.springbackend.dto.rag;

import java.util.List;
import java.util.Map;

public record RAGListResponse(
        List<Map<String, Object>> documents
) {
}
