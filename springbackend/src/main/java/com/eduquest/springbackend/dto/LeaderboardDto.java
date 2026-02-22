package com.eduquest.springbackend.dto;

import java.util.List;

public record LeaderboardDto(
        List<UserScoreDto> userGameScores,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious
) {
}
