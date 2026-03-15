package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserItemResponse(
        Long id,
        Instant createdAt
) {
}
