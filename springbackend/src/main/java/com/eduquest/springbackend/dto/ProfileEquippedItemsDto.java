package com.eduquest.springbackend.dto;

/**
 * Profile equipped items dto
 * @param AVATAR id of item (will check if item has AVATAR type)
 * @param BADGE id of item (will check if item has BADGE type)
 * @param BACKGROUND id of item (will check if item has BACKGROUND type)
 */
public record ProfileEquippedItemsDto(
        Long AVATAR,
        Long BADGE,
        Long BACKGROUND
) {
}
