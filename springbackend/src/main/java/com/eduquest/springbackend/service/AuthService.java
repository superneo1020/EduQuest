package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.SchoolRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.enums.EducatorStatus;
import com.eduquest.springbackend.enums.Theme;
import com.eduquest.springbackend.exception.NotActivatedException;
import com.eduquest.springbackend.exception.ResourceNotFoundException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.School;
import com.eduquest.springbackend.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final SchoolRepository schoolRepo;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;
    private final DtoMapper dtoMapper;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public AuthService(UserRepository userRepo,
                       RoleRepository roleRepo,
                       AuthenticationManager authenticationManager,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       DtoMapper dtoMapper,
                       SchoolRepository schoolRepo, UserService userService) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
        this.dtoMapper = dtoMapper;
        this.schoolRepo = schoolRepo;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        userService.validateUsernameExists(req.username(), "Username already exists");
        userService.validateEmailExists(req.email(), "Email already exists");

        School school = (req.schoolName() == null) ? null :
                schoolRepo.findByName(req.schoolName())
                        .orElseThrow(() -> new ResourceNotFoundException("School not found"));

        AppUser user = new AppUser(
                req.username().trim(),
                req.email().trim(),
                passwordEncoder.encode(req.password())
        );

        Role userRole = roleRepo.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER must be pre-configured"));
        user.getRoles().add(userRole);

        if (req.isEducator()) {
            if (req.schoolName() == null) {
                throw new IllegalArgumentException("School name is required for educators");
            }
            user.setEducatorStatus(EducatorStatus.PENDING);
            user.setActive(false);
        }

        user.setSchool(school);

        UserProfile userProfile = new UserProfile(
                user,
                req.username().trim(),
                new ProfileEquippedItemsDto(null, null, null),
                new ProfilePreferencesDto(Theme.DEFAULT, true, false),
                new ProfilePrivacySettingsDto(false, false, false)
        );

        user.setUserProfile(userProfile);

        AppUser savedUser = userRepo.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getActive(),
                savedUser.getEducatorStatus()
        );
    }

    @Transactional
    public String login(String username, String password) {
        // 1. Authenticate credentials (Username/Password)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        // 2. Check activation status
        boolean isPendingOrRejectedEducator = EnumSet.of(EducatorStatus.PENDING, EducatorStatus.REJECTED)
                .contains(userRepo.findEducatorStatusByUsername(username).orElse(null));
        boolean isActive = userRepo.findIsActiveByUsername(username).orElse(false);

        if (isPendingOrRejectedEducator) {
            logger.warn("[Login Blocked] User {} is authenticated but educator status is pending/rejected", username);
            throw new NotActivatedException("Educator status is pending/rejected.");
        }
        if (!isActive) {
            logger.warn("[Login Blocked] User {} is authenticated but not active", username);
            throw new NotActivatedException("Account has not been activated yet");
        }

        logger.info("Authentication successful for user {}", username);
        return jwtService.generateToken(authentication);
    }

    @Transactional
    public LoginResponse loginAndGetUser(String username, String password) {
        String token = login(username, password);
        AppUser user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        UserDto userDto = dtoMapper.toUser(user);
        return new LoginResponse(token, userDto);
    }

    @Transactional
    public boolean savePassword(Long userId, ResetPasswordRequest req) {
        // 1. find user
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 2. check old password
        if (!passwordEncoder.matches(req.oldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Old password is incorrect");
        }

        // 3. confirm that the new password is not same as old password
        if (passwordEncoder.matches(req.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as old password");
        }

        // 4. encode new password and set it to user
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        logger.info("Successful for changing password for user {}", user.getUsername());
        userRepo.save(user);
        return true;
    }

}
