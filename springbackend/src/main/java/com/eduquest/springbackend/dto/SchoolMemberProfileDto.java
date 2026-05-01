package com.eduquest.springbackend.dto;

/**
 * School member profile dto
 * @param username
 * @param nickname
 * @param email
 * @param equippedItems
 */
public record SchoolMemberProfileDto(
        String username,
        String nickname,
        String email,
        ProfileEquippedItemsDto equippedItems
) {
}
