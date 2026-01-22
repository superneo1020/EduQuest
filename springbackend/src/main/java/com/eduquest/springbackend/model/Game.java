package com.eduquest.springbackend.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserGameScore> userGameScores = new ArrayList<>();

    public Game() {}

    public Game(String name, String icon, String description) {
        this.name = name;
        this.icon = icon;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public List<UserGameScore> getUserGameScores() {
        return userGameScores;
    }

    public void setUserGameScores(List<UserGameScore> userGameScores) {
        this.userGameScores = userGameScores;
    }
}
