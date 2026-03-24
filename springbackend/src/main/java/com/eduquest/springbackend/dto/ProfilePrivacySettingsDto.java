package com.eduquest.springbackend.dto;

public record ProfilePrivacySettingsDto(
        Boolean show_email,
        Boolean show_school,
        Boolean show_class
) {
}
