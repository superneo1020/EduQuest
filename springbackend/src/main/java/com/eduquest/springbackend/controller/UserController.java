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

    @GetMapping("/")
    public ResponseEntity<?> getMyBasicInfo(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findBasicInfoById(userDetails.getId()));
    }

    @GetMapping("/point")
    public ResponseEntity<?> getMyPoints(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findPointsById(userDetails.getId()));
    }

    @GetMapping("/school")
    public ResponseEntity<?> getMySchool(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findSchoolNameById(userDetails.getId()));
    }

    @PostMapping("/school")
    public ResponseEntity<?> updateMySchool(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @RequestBody ResetSchoolRequest req
    ) {
        return ResponseEntity.ok(userService.saveSchoolId(userDetails.getId(), req));
    }

    @GetMapping("/school/members")
    public ResponseEntity<?> getAllUsersByMySchoolId(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userService.showAllSchoolMembers(userDetails.getId(), pageable));
    }

    @GetMapping("/email")
    public ResponseEntity<?> getMyEmail(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findEmailById(userDetails.getId()));
    }

    @PostMapping("/email")
    public  ResponseEntity<?> updateMyEmail(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @RequestBody ResetEmailRequest req
    ) {
        return  ResponseEntity.ok(userService.saveEmail(userDetails.getId(), req));
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getMyRoles(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findRoleNamesById(userDetails.getId()));
    }

    @GetMapping("/educator-status")
    public ResponseEntity<?> getMyEducatorStatus(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userService.findEducatorStatusById(userDetails.getId()));
    }

    @PostMapping("/password")
    public ResponseEntity<?> updatePassword(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody ResetPasswordRequest req
    ) {
        return ResponseEntity.ok(authService.savePassword(userDetails.getId(), req));
    }
}
