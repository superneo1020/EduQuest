package com.eduquest.springbackend.dto;

public record SchoolMemberProfileDto(
        String username,
        String nickname,
        String email,
        ProfileEquippedItemsDto equippedItems
) {
}
