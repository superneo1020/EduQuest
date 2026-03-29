package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.Theme;

public record ProfilePreferencesDto(
        Theme theme,
        Boolean sound,
        Boolean notifications
) {
}
