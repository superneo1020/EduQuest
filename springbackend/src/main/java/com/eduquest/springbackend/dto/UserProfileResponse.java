package com.eduquest.springbackend.dto;

public record UserProfileResponse(
        String nickname,
        ProfileEquippedItemsDto equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings
) {
}
