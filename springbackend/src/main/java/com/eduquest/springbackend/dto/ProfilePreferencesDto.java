package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.Theme;

/**
 * Profile preferences dto (Feature Deprecated)
 * @param theme
 * @param sound
 * @param notifications
 */
public record ProfilePreferencesDto(
        Theme theme,
        Boolean sound,
        Boolean notifications
) {
}
