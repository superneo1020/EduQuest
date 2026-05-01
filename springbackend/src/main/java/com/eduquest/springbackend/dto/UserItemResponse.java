package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User item response
 * @param id
 * @param createdAt
 */
public record UserItemResponse(
        Long id,
        Instant createdAt
) {
}
