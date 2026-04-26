package com.eduquest.springbackend.dto;

public record GameMiniDto(
        String type,
        String name,
        String difficulty,
        String description
) {
}
