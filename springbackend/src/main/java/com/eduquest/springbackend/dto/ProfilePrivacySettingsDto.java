package com.eduquest.springbackend.dto;

/**
 * Profile privacy settings dto (Feature Deprecated)
 * @param show_email
 * @param show_school
 * @param show_class
 */
public record ProfilePrivacySettingsDto(
        Boolean show_email,
        Boolean show_school,
        Boolean show_class
) {
}
