package com.eduquest.springbackend.dto;

/**
 * Login response
 * @param token
 * @param user
 */
public record LoginResponse(
        String token,
        UserDto user
) {
}
