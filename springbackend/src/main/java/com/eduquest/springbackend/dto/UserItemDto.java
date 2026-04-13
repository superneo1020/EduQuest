package com.eduquest.springbackend.dto;

import java.time.Instant;

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
