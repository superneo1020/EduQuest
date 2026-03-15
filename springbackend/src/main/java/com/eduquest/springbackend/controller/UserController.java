package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.service.UserGameScoreService;
import com.eduquest.springbackend.service.UserService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final UserGameScoreService userGameScoreService;

    public UserController(UserService userService, UserGameScoreService userGameScoreService) {
        this.userService = userService;
        this.userGameScoreService = userGameScoreService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showGameRecord(userDetails.getUsername(), pageable));
    }

    @GetMapping("/point")
    public ResponseEntity<?> getMyPoints(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findPointsByUsername(userDetails.getUsername()));
    }
}
