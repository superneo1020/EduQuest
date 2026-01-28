package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;

@Entity
@Table(name = "missions")
public class Mission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String mission;

    @Column(columnDefinition = "TEXT")
    private String missionIcon;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer pointsReward = 0;

    @Column(insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    @ManyToMany(mappedBy = "missions")
    private Collection<AppUser> users = new ArrayList<>();

    public Mission() {}

    public Mission(String mission, String missionIcon, String description, Integer pointsReward) {
        this.mission = mission;
        this.missionIcon = missionIcon;
        this.description = description;
        this.pointsReward = pointsReward;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mission) {
        this.mission = mission;
    }

    public String getMissionIcon() {
        return missionIcon;
    }

    public void setMissionIcon(String missionIcon) {
        this.missionIcon = missionIcon;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getPointsReward() {
        return pointsReward;
    }

    public void setPointsReward(Integer expReward) {
        this.pointsReward = pointsReward;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Collection<AppUser> getUsers() {
        return users;
    }

    public void setUsers(Collection<AppUser> users) {
        this.users = users;
    }
}