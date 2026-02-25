package com.eduquest.springbackend.dto;

import java.util.List;

public record LeaderboardDto(
        List<LeaderboardScoreDto> userGameScores,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious
) {
}
