package com.eduquest.springbackend.dto;

import java.util.List;

public record UtilDetailedListResponse<T> (
        List<T> items,
        long total,
        boolean isEmpty
) {
}
