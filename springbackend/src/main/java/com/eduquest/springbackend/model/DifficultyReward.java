package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "difficulty_rewards")
public class DifficultyReward {
    @Id
    @Column(nullable = false, length = 20, unique = true)
    private String difficulty;

    @Column(nullable = false)
    @Min(value = 1, message = "Multiplier should be larger than zero")
    private Integer multiplier = 1;

    public DifficultyReward() {}

    public DifficultyReward(String difficulty, Integer multiplier) {
        this.difficulty = difficulty;
        this.multiplier = multiplier;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getMultiplier() {
        return multiplier;
    }

    public void setMultiplier(Integer multiplier) {
        this.multiplier = multiplier;
    }
}
