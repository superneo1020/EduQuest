package com.eduquest.springbackend.dto;

import java.util.List;

public record UserGameRecordDto(
        List<UserGameScoreDto> userGameScores,
        int currentPage,
        int totalPages,
        long totalItems,
        boolean hasNext,
        boolean hasPrevious
) {
}