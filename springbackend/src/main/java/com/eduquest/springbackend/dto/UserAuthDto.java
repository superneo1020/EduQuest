package com.eduquest.springbackend.dto;

public record UserAuthDto(
        Long id,
        String username,
        String password
) {
}
