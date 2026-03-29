package com.eduquest.springbackend.dto;

import java.util.List;

public record SliceResponse<T>(
        List<T> slice,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious
) {
}
