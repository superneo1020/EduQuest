package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserProfileRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.enums.Theme;
import com.eduquest.springbackend.exception.ResourceNotFoundException;
import com.eduquest.springbackend.model.UserProfile;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            ProfileEquippedItemsDto equippedItems = mergeWithDefaultEquippedItems(req.equippedItems());
            isEquippedItemsExists(username, equippedItems);
            userProfile.setEquippedItems(equippedItems);
        }

        // Handle preferences - set if not null and merge if partial
        if (req.preferences() != null) {
            userProfile.setPreferences(mergeWithDefaultPreferences(req.preferences()));
        }

        // Handle privacySettings - set if not null and merge if partial
        if (req.privacySettings() != null) {
            userProfile.setPrivacySettings(mergeWithDefaultPrivacySettings(req.privacySettings()));
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
    public void isEquippedItemsExists(String username, ProfileEquippedItemsDto equippedItems) {
        if (equippedItems.AVATAR() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.AVATAR(), "AVATAR"))
            throw new ResourceNotFoundException("Avatar not found");
        if (equippedItems.BADGE() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.BADGE(), "BADGE"))
            throw  new ResourceNotFoundException("Badge not found");
        if (equippedItems.BACKGROUND() != null && !userItemService.checkUserItemAndItemExists(username, equippedItems.BACKGROUND(), "BACKGROUND"))
            throw new ResourceNotFoundException("Background not found");
    }

    @NonNull
    private static ProfileEquippedItemsDto mergeWithDefaultEquippedItems(@NonNull ProfileEquippedItemsDto equippedItems) {
        return new ProfileEquippedItemsDto(
                equippedItems.AVATAR() != null ? equippedItems.AVATAR() : null,
                equippedItems.BADGE() != null ? equippedItems.BADGE() : null,
                equippedItems.BACKGROUND() != null ? equippedItems.BACKGROUND() : null
        );
    }

    @NonNull
    private static ProfilePreferencesDto mergeWithDefaultPreferences(@NonNull ProfilePreferencesDto preferences) {
        return new ProfilePreferencesDto(
                preferences.theme() != null ? preferences.theme() : Theme.DEFAULT,
                preferences.sound() != null ? preferences.sound() : true,
                preferences.notifications() != null ? preferences.notifications() : false
        );
    }

    @NonNull
    private static ProfilePrivacySettingsDto mergeWithDefaultPrivacySettings(@NonNull ProfilePrivacySettingsDto privacySettings) {
        return new ProfilePrivacySettingsDto(
                privacySettings.show_email() != null ? privacySettings.show_email() : false,
                privacySettings.show_school() != null ? privacySettings.show_school() : false,
                privacySettings.show_class() != null ? privacySettings.show_class() : false
        );
    }
}
