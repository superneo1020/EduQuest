package com.eduquest.springbackend.dto;

import java.time.LocalDate;

/**
 * User mission dto
 * @param type
 * @param name
 * @param difficulty
 * @param icon
 * @param description
 * @param scores
 * @param date
 */
public record UserMissionDto(
        String type,
        String name,
        String difficulty,
        String icon,
        String description,
        Integer scores,
        LocalDate date
) {
}
