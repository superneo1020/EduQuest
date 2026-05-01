package com.eduquest.springbackend.dto;

/**
 * User profile response
 * @param nickname
 * @param equippedItems
 * @param preferences
 * @param privacySettings
 */
public record UserProfileResponse(
        String nickname,
        ProfileEquippedItemsDto equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings
) {
}
