package com.eduquest.springbackend.dto;

import java.util.List;

public record UtilSliceResponse<T>(
        List<T> slice,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious
) {
}
