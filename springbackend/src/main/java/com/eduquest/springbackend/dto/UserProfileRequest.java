package com.eduquest.springbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public record UserProfileRequest(
        @Size(max = 50)
        String nickname,

        @Valid
        ProfileEquippedItemsDto equippedItems,

        @Valid
        ProfilePreferencesDto preferences,

        @Valid
        ProfilePrivacySettingsDto privacySettings
) {
}
