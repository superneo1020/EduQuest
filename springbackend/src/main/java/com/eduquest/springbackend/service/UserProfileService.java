package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserProfileRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.exception.ResourceNotFoundException;
import com.eduquest.springbackend.model.UserProfile;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepo;

    private final UserService userService;
    private final UserItemService userItemService;

    public UserProfileService(
            UserService userService,
            UserProfileRepository userProfileRepo,
            UserItemService userItemService) {
        this.userService = userService;
        this.userProfileRepo = userProfileRepo;
        this.userItemService = userItemService;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(@NonNull String username) {
        Long userId =  userService.checkIdByUsername(username);
        UserProfile userProfile = userProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new UserProfileDto(
                userProfile.getNickname(),
                userProfile.getEquippedItems(),
                userProfile.getPreferences(),
                userProfile.getPrivacySettings(),
                userProfile.getCreatedAt(),
                userProfile.getUpdatedAt()
        );
    }

    @Transactional
    public UserProfileResponse setUserProfile(@NonNull String username, @NonNull UserProfileRequest req) {
        UserProfile userProfile = userProfileRepo.findByUserId(userService.checkIdByUsername(username))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.nickname() != null && !req.nickname().isBlank()) {
            userProfile.setNickname(req.nickname().trim());
        }

        // Handle equippedItems - set if not null and merge if partial
        if (req.equippedItems() != null) {
            ProfileEquippedItemsDto equippedItems = mergeWithDefaultEquippedItems(
                    req.equippedItems(),
                    userProfile.getEquippedItems()
            );
            validateItemsOwnership(username, equippedItems);
            userProfile.setEquippedItems(equippedItems);
        }

        // Handle preferences - set if not null and merge if partial
        if (req.preferences() != null) {
            userProfile.setPreferences(mergeWithDefaultPreferences(
                    req.preferences(),
                    userProfile.getPreferences()
            ));
        }

        // Handle privacySettings - set if not null and merge if partial
        if (req.privacySettings() != null) {
            userProfile.setPrivacySettings(mergeWithDefaultPrivacySettings(
                    req.privacySettings(),
                    userProfile.getPrivacySettings()
            ));
        }

        UserProfile savedProfile = userProfileRepo.save(userProfile);

        return new UserProfileResponse(
                savedProfile.getNickname(),
                savedProfile.getEquippedItems(),
                savedProfile.getPreferences(),
                savedProfile.getPrivacySettings()
        );
    }

    @Transactional(readOnly = true)
    public void validateItemsOwnership(String username, ProfileEquippedItemsDto equippedItems) {
        if (equippedItems.AVATAR() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.AVATAR(), "AVATAR"))
            throw new ResourceNotFoundException("Avatar not found");
        if (equippedItems.BADGE() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.BADGE(), "BADGE"))
            throw  new ResourceNotFoundException("Badge not found");
        if (equippedItems.BACKGROUND() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.BACKGROUND(), "BACKGROUND"))
            throw new ResourceNotFoundException("Background not found");
    }

    private static ProfileEquippedItemsDto mergeWithDefaultEquippedItems(
            Map<String, Long> incoming,
            ProfileEquippedItemsDto current
    ) {
        return new ProfileEquippedItemsDto(
                incoming.containsKey("AVATAR") ? incoming.get("AVATAR") : current.AVATAR(),
                incoming.containsKey("BADGE") ? incoming.get("BADGE") : current.BADGE(),
                incoming.containsKey("BACKGROUND") ? incoming.get("BACKGROUND") : current.BACKGROUND()
        );
    }

    private static ProfilePreferencesDto mergeWithDefaultPreferences(
            ProfilePreferencesDto incoming,
            ProfilePreferencesDto current
    ) {
        return new ProfilePreferencesDto(
                incoming.theme() != null ? incoming.theme() : current.theme(),
                incoming.sound() != null ? incoming.sound() : current.sound(),
                incoming.notifications() != null ? incoming.notifications() : current.notifications()
        );
    }

    private static ProfilePrivacySettingsDto mergeWithDefaultPrivacySettings(
            ProfilePrivacySettingsDto incoming,
            ProfilePrivacySettingsDto current
    ) {
        return new ProfilePrivacySettingsDto(
                incoming.show_email() != null ? incoming.show_email() : current.show_email(),
                incoming.show_school() != null ? incoming.show_school() : current.show_school(),
                incoming.show_class() != null ? incoming.show_class() : current.show_class()
        );
    }
}
