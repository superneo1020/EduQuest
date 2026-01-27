package com.eduquest.springbackend.dto;

import java.util.List;

public record UserProfileDto(String username,
                             String email,
                             List<String> roles,
                             List<Integer> userGameScores,
                             List<Integer> userExp) {
}