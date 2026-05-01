package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.UserMissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/mission")
public class UserMissionController {

    private final UserMissionService userMissionService;

    public UserMissionController(UserMissionService userMissionService) {
        this.userMissionService = userMissionService;
    }

    /**
     * Retrieves missions for the current user based on completion status.
     * Returns either completed or pending missions depending on the status parameter.
     */
    @GetMapping("/{completed}")
    public ResponseEntity<?> getMyMission(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable Boolean completed
    ) {
        return ResponseEntity.ok(userMissionService.showMission(userDetails.getId(), completed));
    }
}
