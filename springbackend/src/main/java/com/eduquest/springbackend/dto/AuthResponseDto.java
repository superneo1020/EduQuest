package com.eduquest.springbackend.dto;

public record AuthResponseDto(String token, UserDto user) {
}
