package com.eduquest.springbackend.model;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserMissionId implements Serializable {
    private Long userId;
    private Long missionId;

    public UserMissionId() {}

    public UserMissionId(Long userId, Long missionId) {
        this.userId = userId;
        this.missionId = missionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getMissionId() {
        return missionId;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        UserMissionId that = (UserMissionId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(missionId, that.missionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, missionId);
    }
}