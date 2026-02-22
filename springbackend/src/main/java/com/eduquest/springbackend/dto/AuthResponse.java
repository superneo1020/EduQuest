package com.eduquest.springbackend.dto;

public record AuthResponse(String token, UserDto user) {
}
