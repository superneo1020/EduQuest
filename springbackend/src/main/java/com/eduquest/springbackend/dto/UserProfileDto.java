package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * User profile dto
 * @param nickname
 * @param equippedItems
 * @param preferences
 * @param privacySettings
 * @param createdAt
 * @param updatedAt
 */
public record UserProfileDto(
        String nickname,
        ProfileEquippedItemsDto equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings,
        Instant createdAt,
        Instant updatedAt
) {
}
