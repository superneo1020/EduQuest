package com.eduquest.springbackend.dto;

import java.util.List;

public record UserProfileDto(String username,
                             String email,
                             List<String> roles,
                             List<UserGameScoreDto> userGameScores,
                             int currentPage,
                             int totalPages,
                             long totalItems,
                             boolean hasNext,
                             boolean hasPrevious) {
}