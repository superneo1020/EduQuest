package com.eduquest.springbackend.dto;

/**
 * User auth dto for custom app user details
 * @param id
 * @param username
 * @param password
 */
public record UserAuthDto(
        Long id,
        String username,
        String password
) {
}
