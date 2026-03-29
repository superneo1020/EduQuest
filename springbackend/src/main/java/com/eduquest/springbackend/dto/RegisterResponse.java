package com.eduquest.springbackend.dto;

public record RegisterResponse(
        Long id,
        String username,
        String email
) {
}
