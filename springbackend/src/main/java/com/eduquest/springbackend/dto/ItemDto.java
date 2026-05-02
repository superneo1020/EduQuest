package com.eduquest.springbackend.dto;

/**
 * Item dto
 * @param id
 * @param type
 * @param name
 * @param description
 * @param icon
 * @param price
 */
public record ItemDto(
        Long id,
        String type,
        String name,
        String description,
        String icon,
        Integer price
) {
}
