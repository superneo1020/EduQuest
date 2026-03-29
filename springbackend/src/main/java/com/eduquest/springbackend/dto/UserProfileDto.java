package com.eduquest.springbackend.dto;

import java.time.Instant;

public record UserProfileDto(
        String nickname,
        ProfileEquippedItemsDto equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings,
        Instant createdAt,
        Instant updatedAt
) {
}
