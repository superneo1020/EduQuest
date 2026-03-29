package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

@Entity
@Table(name = "user_activities")
public class UserActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(length = 50, nullable = false)
    private String roleInGroup;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant updatedAt;

    public UserActivity() {}

    public UserActivity(Activity activity, AppUser user, String roleInGroup, Boolean completed) {
        this.activity = activity;
        this.user = user;
        this.roleInGroup = roleInGroup;
        this.completed = completed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Activity getActivity() {
        return activity;
    }

    public void setActivity(Activity activity) {
        this.activity = activity;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public String getRoleInGroup() {
        return roleInGroup;
    }

    public void setRoleInGroup(String roleInGroup) {
        this.roleInGroup = roleInGroup;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
