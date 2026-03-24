package com.eduquest.springbackend.dto;

public record LoginResponse(
        String token,
        UserDto user
) {
}
