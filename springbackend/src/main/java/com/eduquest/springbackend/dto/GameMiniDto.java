package com.eduquest.springbackend.dto;

/**
 * Minimal game dto
 * @param type
 * @param name
 * @param difficulty
 * @param description
 */
public record GameMiniDto(
        String type,
        String name,
        String difficulty,
        String description
) {
}
