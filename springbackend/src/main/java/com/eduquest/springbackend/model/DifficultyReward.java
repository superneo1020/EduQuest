package com.eduquest.springbackend.model;

import com.eduquest.springbackend.model.type.DifficultyType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "difficulty_rewards")
public class DifficultyReward {
    @Id
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, unique = true)
    private DifficultyType difficulty;

    @Column(nullable = false)
    @Min(value = 1, message = "Multiplier should be larger than zero")
    private Integer multiplier = 1;

    public DifficultyReward() {}

    public DifficultyReward(DifficultyType difficulty, Integer multiplier) {
        this.difficulty = difficulty;
        this.multiplier = multiplier;
    }

    public DifficultyType getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyType difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getMultiplier() {
        return multiplier;
    }

    public void setMultiplier(Integer multiplier) {
        this.multiplier = multiplier;
    }
}
