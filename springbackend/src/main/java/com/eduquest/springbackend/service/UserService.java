package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.SchoolRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.enums.EducatorStatus;
import com.eduquest.springbackend.exception.DuplicateResourceException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.School;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final SchoolRepository schoolRepo;
    private final DtoMapper dtoMapper;

    public UserService(UserRepository userRepo,
                       RoleRepository roleRepo,
                       SchoolRepository schoolRepo,
                       DtoMapper dtoMapper) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.schoolRepo = schoolRepo;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public void validateUsernameExists(String username, String message) {
        if (userRepo.existsByUsername(username)) {
            throw new DuplicateResourceException(message);
        }
    }

    @Transactional(readOnly = true)
    public void validateEmailExists(String email, String message) {
        if (userRepo.existsByEmail(email)) {
            throw new DuplicateResourceException(message);
        }
    }

    @Transactional
    public boolean saveEmail(Long userId, ResetEmailRequest req) {
        // 1. find user
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 2. confirm that the new email is not same as old email
        if (user.getEmail().equals(req.newEmail().trim())) {
            throw new IllegalArgumentException("New email cannot be the same as old email");
        }

        // 3. validate new email
        validateEmailExists(req.newEmail().trim(), "Email already used for other users");

        // 4. set new email to user
        user.setEmail(req.newEmail().trim());
        userRepo.save(user);
        return true;
    }

    @Transactional
    public boolean saveSchoolId(Long userId, ResetSchoolRequest req) {
        // 1. find user
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 2. find new school
        School newSchool = schoolRepo.findByName(req.newSchoolName().trim())
                .orElseThrow(() -> new UsernameNotFoundException("School not found"));

        // 3. confirm that the new schoolId is not same as old schoolId
        if (user.getSchool() != null && user.getSchool().getId().equals(newSchool.getId())) {
            throw new IllegalArgumentException("New schoolId cannot be the same as old schoolId");
        }

        // 4. encode new school and set it to user
        user.setSchool(newSchool);
        userRepo.save(user);
        return true;
    }

    @Transactional
    public void addRoleToUser(String user_name, String role_name) {
        AppUser user = userRepo.findByUsername(user_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + user_name));
        Role role = roleRepo.findByName(role_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + role_name));
        user.getRoles().add(role);
    }

    @Transactional(readOnly = true)
    public Integer findPointsById(Long userId) {
        return userRepo.findPointsById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + userId));
    }

    @Transactional(readOnly = true)
    public String findSchoolNameById(Long userId) {
        return userRepo.findSchoolNameById(userId).orElse(null);
    }

    @Transactional(readOnly = true)
    public String findEmailById(Long userId) {
        return userRepo.findEmailById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + userId));
    }

    @Transactional(readOnly = true)
    public Collection<String> findRoleNamesById(Long userId) {
        return userRepo.findRoleNamesByIdOptional(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + userId));
    }

    @Transactional(readOnly = true)
    public EducatorStatus findEducatorStatusById(Long userId) {
        return userRepo.findEducatorStatusById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + userId));
    }

    @Transactional(readOnly = true)
    public UserDto findBasicInfoById(Long userId) {
        AppUser user = userRepo.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + userId));
        return dtoMapper.toUser(user);
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserMiniDto> findAllUsernameById(Long userId, Pageable pageable) {
        var page = userRepo.findAllUserRecordByIdWithSchool(userId, pageable);
        return dtoMapper.toPageResponse(page);
    }
}
