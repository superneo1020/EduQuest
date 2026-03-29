package com.eduquest.springbackend.model;

import com.eduquest.springbackend.dto.ProfileEquippedItemsDto;
import com.eduquest.springbackend.dto.ProfilePreferencesDto;
import com.eduquest.springbackend.dto.ProfilePrivacySettingsDto;
import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.generator.EventType;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(length = 50)
    private String nickname;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ProfileEquippedItemsDto equippedItems;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ProfilePreferencesDto preferences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ProfilePrivacySettingsDto privacySettings;

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

    public UserProfile() {}

    public UserProfile(AppUser user, String nickname) {
        this.user = user;
        this.nickname = nickname;
    }

    public UserProfile(AppUser user, String nickname, ProfileEquippedItemsDto equippedItems, 
                       ProfilePreferencesDto preferences, ProfilePrivacySettingsDto privacySettings) {
        this(user, nickname);
        this.equippedItems = equippedItems;
        this.preferences = preferences;
        this.privacySettings = privacySettings;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public ProfileEquippedItemsDto getEquippedItems() {
        return equippedItems;
    }

    public void setEquippedItems(ProfileEquippedItemsDto equippedItems) {
        this.equippedItems = equippedItems;
    }

    public ProfilePreferencesDto getPreferences() {
        return preferences;
    }

    public void setPreferences(ProfilePreferencesDto preferences) {
        this.preferences = preferences;
    }

    public ProfilePrivacySettingsDto getPrivacySettings() {
        return privacySettings;
    }

    public void setPrivacySettings(ProfilePrivacySettingsDto privacySettings) {
        this.privacySettings = privacySettings;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
