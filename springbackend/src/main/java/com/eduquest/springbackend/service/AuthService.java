package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.SchoolRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.enums.Theme;
import com.eduquest.springbackend.exception.DuplicateResourceException;
import com.eduquest.springbackend.exception.ResourceNotFoundException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.School;
import com.eduquest.springbackend.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDtoMapper userDtoMapper;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    private final SchoolRepository schoolRepository;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       AuthenticationManager authenticationManager,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserDtoMapper userDtoMapper, SchoolRepository schoolRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDtoMapper = userDtoMapper;
        this.schoolRepository = schoolRepository;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateResourceException("Email already exists");
        }

        School school = (req.schoolName() == null) ? null :
                schoolRepository.findByName(req.schoolName())
                        .orElseThrow(() -> new ResourceNotFoundException("School not found"));

        AppUser user = new AppUser(
                req.username().trim(),
                req.email().trim(),
                passwordEncoder.encode(req.password())
        );

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER must be pre-configured"));
        user.getRoles().add(userRole);

        if (req.isEducator()) {
            Role educatorRole = roleRepository.findByName("ROLE_EDUCATOR")
                    .orElseThrow(() -> new IllegalStateException("ROLE_EDUCATOR must be pre-configured"));
            user.getRoles().add(educatorRole);
        }

        user.setSchool(school);

        UserProfile userProfile = getUserProfile(req, user);
        user.setUserProfile(userProfile);

        AppUser savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail()
        );
    }

    @NonNull
    private static UserProfile getUserProfile(@NonNull RegisterRequest req, @NonNull AppUser user) {
        String nickname = (req.nickname() == null || req.nickname().isBlank())
                ? req.username() : req.nickname().trim();
        UserProfile userProfile = new UserProfile(user, nickname);

        // Handle equippedItems - create defaults if null or merge if partial
        ProfileEquippedItemsDto equippedItems = req.equippedItems() != null
                ? mergeWithDefaultEquippedItems(req.equippedItems())
                : new ProfileEquippedItemsDto(null, null, null);

        // Handle preferences - create defaults if null or merge if partial
        ProfilePreferencesDto preferences = req.preferences() != null
                ? mergeWithDefaultPreferences(req.preferences())
                : new ProfilePreferencesDto(Theme.DEFAULT, true, false);

        // Handle privacySettings - create defaults if null or merge if partial
        ProfilePrivacySettingsDto privacySettings = req.privacySettings() != null
                ? mergeWithDefaultPrivacySettings(req.privacySettings())
                : new ProfilePrivacySettingsDto(false, false, false);

        userProfile.setEquippedItems(equippedItems);
        userProfile.setPreferences(preferences);
        userProfile.setPrivacySettings(privacySettings);
        return userProfile;
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

    @Transactional
    public String login(String username, String password) {
        logger.info("Authenticating user: {}", username);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        if (authentication.isAuthenticated()) {
            logger.info("Authentication successful for user {}", username);
            return jwtService.generateToken(authentication);
        }
        logger.error("Authentication failed for user {}", username);
        throw new BadCredentialsException("Invalid username or password");
    }

    @Transactional
    public LoginResponse loginAndGetUser(String username, String password) {
        String token = login(username, password);
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        UserDto userDto = userDtoMapper.toUser(user);
        return new LoginResponse(token, userDto);
    }
}
