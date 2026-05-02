package com.eduquest.springbackend.dto;

/**
 * Minimal user dto
 * @param id
 * @param username
 * @param email
 */
public record UserMiniDto(
        Long id,
        String username,
        String email
) {
}
