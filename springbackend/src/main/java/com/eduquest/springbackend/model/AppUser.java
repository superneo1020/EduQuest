package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, insertable = false)
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Min(value = 0, message = "User points must be at least 0")
    private Integer points = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Collection<Role> roles = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserGameScore> userGameScores = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserMission> userMissions = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserItem> userItems = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClassMember> classMemberships = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserActivity> userActivities = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfile userProfile;

    public AppUser() {}

    public AppUser(String username, String email, String password, School school) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.school = school;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Collection<Role> getRoles() {
        return roles;
    }

    public void setRoles(Collection<Role> roles) {
        this.roles = roles;
    }

    public List<UserGameScore> getUserGameScores() {
        return userGameScores;
    }

    public void setUserGameScores(List<UserGameScore> userGameScores) {
        this.userGameScores = userGameScores;
    }

    public List<UserMission> getUserMissions() {
        return userMissions;
    }

    public void setUserMissions(List<UserMission> userMissions) {
        this.userMissions = userMissions;
    }

    public List<UserItem> getUserItems() {
        return userItems;
    }

    public void setUserItems(List<UserItem> userItems) {
        this.userItems = userItems;
    }

    public List<ClassMember> getClassMemberships() {
        return classMemberships;
    }

    public void setClassMemberships(List<ClassMember> classMemberships) {
        this.classMemberships = classMemberships;
    }

    public List<UserActivity> getUserActivities() {
        return userActivities;
    }

    public void setUserActivities(List<UserActivity> userActivities) {
        this.userActivities = userActivities;
    }

    public UserProfile getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfile userProfile) {
        this.userProfile = userProfile;
    }
}