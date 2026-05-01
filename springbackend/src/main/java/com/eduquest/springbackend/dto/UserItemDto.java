package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User item dto
 * @param id
 * @param itemId
 * @param name
 * @param type
 * @param icon
 * @param description
 * @param createdAt
 */
public record UserItemDto(
        Long id,
        Long itemId,
        String name,
        String type,
        String icon,
        String description,
        Instant createdAt
) {
}
