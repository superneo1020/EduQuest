package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/mission")
public class UserMissionController {

    private final UserService userService;

    public UserMissionController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping({"/", "/{completed}"})
    public ResponseEntity<?> getMission(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable(required = false) Boolean completed
    ) {
        return completed != null
                ? ResponseEntity.ok(userService.showMission(userDetails, completed))
                : ResponseEntity.ok(userService.showMission(userDetails, false));
    }
}
