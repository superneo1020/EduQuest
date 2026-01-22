package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

@Entity
@Table(name = "user_missions")
public class UserMission {
    @EmbeddedId
    private UserMissionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("missionId")
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "created_at",
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    public UserMission() {}

    public UserMission(AppUser user, Mission mission) {
        this.user = user;
        this.mission = mission;
        this.id = new UserMissionId(user.getId(), mission.getId());
    }

    public UserMissionId getId() {
        return id;
    }

    public void setId(UserMissionId id) {
        this.id = id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public Mission getMission() {
        return mission;
    }

    public void setMission(Mission mission) {
        this.mission = mission;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}