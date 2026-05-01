package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.ResetEmailRequest;
import com.eduquest.springbackend.dto.ResetPasswordRequest;
import com.eduquest.springbackend.dto.ResetSchoolRequest;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.AuthService;
import com.eduquest.springbackend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /**
     * Retrieves the current user's basic profile information.
     * Returns essential user details like username, roles, and status.
     */
    @GetMapping
    public ResponseEntity<?> getMyBasicInfo(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findBasicInfoById(userDetails.getId()));
    }

    /**
     * Retrieves the current user's point balance.
     * Returns the total number of points available for purchases in the shop.
     */
    @GetMapping("/point")
    public ResponseEntity<?> getMyPoints(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findPointsById(userDetails.getId()));
    }

    /**
     * Retrieves the current user's school information.
     * Returns the name of the school the user is registered with.
     */
    @GetMapping("/school")
    public ResponseEntity<?> getMySchool(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findSchoolNameById(userDetails.getId()));
    }

    /**
     * Updates the current user's school association.
     * Allows users to change their registered school.
     */
    @PostMapping("/school")
    public ResponseEntity<?> updateMySchool(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @RequestBody ResetSchoolRequest req
    ) {
        return ResponseEntity.ok(userService.saveSchoolId(userDetails.getId(), req));
    }

    /**
     * Retrieves all users within the current user's school.
     * Returns a paginated list of school members for user discovery.
     */
    @GetMapping("/school/members")
    public ResponseEntity<?> getAllUsersByMySchoolId(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userService.showAllSchoolMembers(userDetails.getId(), pageable));
    }

    /**
     * Retrieves the current user's email address.
     * Returns the user's registered email for account management.
     */
    @GetMapping("/email")
    public ResponseEntity<?> getMyEmail(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findEmailById(userDetails.getId()));
    }

    /**
     * Updates the current user's email address.
     * Allows users to change their registered email for account notifications.
     */
    @PostMapping("/email")
    public  ResponseEntity<?> updateMyEmail(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @RequestBody ResetEmailRequest req
    ) {
        return  ResponseEntity.ok(userService.saveEmail(userDetails.getId(), req));
    }

    /**
     * Retrieves the current user's role assignments.
     * Returns all roles (Student, Educator, Admin) assigned to the user.
     */
    @GetMapping("/roles")
    public ResponseEntity<?> getMyRoles(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findRoleNamesById(userDetails.getId()));
    }

    /**
     * Retrieves the current user's educator approval status.
     * Returns whether the user's educator account has been approved by administrators.
     */
    @GetMapping("/educator-status")
    public ResponseEntity<?> getMyEducatorStatus(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findEducatorStatusById(userDetails.getId()));
    }

    /**
     * Updates the current user's password.
     * Allows users to change their account password for security.
     */
    @PostMapping("/password")
    public ResponseEntity<?> updatePassword(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody ResetPasswordRequest req
    ) {
        return ResponseEntity.ok(authService.savePassword(userDetails.getId(), req));
    }
}
