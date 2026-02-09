package com.eduquest.springbackend.model;

import com.eduquest.springbackend.model.type.DifficultyType;
import com.eduquest.springbackend.model.type.GameType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "missions")
public class Mission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameType type;

    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyType difficulty;

    @Column(columnDefinition = "TEXT")
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Min(value = 0, message = "Game scores must be at least 0")
    private Integer scores = 0;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserMission> userMissions = new ArrayList<>();

    public Mission() {
    }

    public Mission(GameType type, String name, DifficultyType difficulty, String icon, String description, Integer scores) {
        this.type = type;
        this.name = name;
        this.difficulty = difficulty;
        this.icon = icon;
        this.description = description;
        this.scores = scores;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GameType getType() {
        return type;
    }

    public void setType(GameType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public DifficultyType getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyType difficulty) {
        this.difficulty = difficulty;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getScores() {
        return scores;
    }

    public void setScores(Integer scores) {
        this.scores = scores;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<UserMission> getUserMissions() {
        return userMissions;
    }

    public void setUserMissions(List<UserMission> userMissions) {
        this.userMissions = userMissions;
    }
}
