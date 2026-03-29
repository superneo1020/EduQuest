package com.eduquest.springbackend.dto;

public record ItemStoreDto(
        Long id,
        String type,
        String name,
        String description,
        String icon,
        Integer price
) {
}
