package com.eduquest.springbackend.dto;

/**
 * Game dto
 * @param id
 * @param type
 * @param name
 * @param difficulty
 * @param icon
 * @param description
 */
public record GameDto(
        Long id,
        String type,
        String name,
        String difficulty,
        String icon,
        String description
) {
}
