package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserItemDto(
        String name,
        String type,
        String icon,
        String description,
        Instant createdAt
) {
}
