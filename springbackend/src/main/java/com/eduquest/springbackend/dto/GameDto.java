package com.eduquest.springbackend.dto;

public record GameDto(
    Long id,
    String type,
    String name,
    String difficulty,
    String icon,
    String description
) {
}
