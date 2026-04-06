package com.eduquest.springbackend.dto;

public record ItemDto(
        Long id,
        String type,
        String name,
        String description,
        String icon,
        Integer price
) {
}
