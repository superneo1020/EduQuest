package com.eduquest.springbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(max = 20)
        String username,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @NotNull
        Boolean isEducator,

        @Size(max = 100)
        String schoolName,

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
