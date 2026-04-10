package com.eduquest.springbackend.dto;

public record UserMiniDto(
        Long id,
        String username,
        String email
) {
}
