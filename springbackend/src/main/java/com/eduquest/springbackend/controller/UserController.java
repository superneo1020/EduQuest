package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.service.UserService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(@AuthenticationPrincipal UserDetails userDetails,
                                     @PageableDefault(
                                             sort = "createdAt",
                                             direction = Sort.Direction.DESC
                                     ) Pageable pageable) {
        return ResponseEntity.ok(userService.showProfile(userDetails, pageable));
    }

    @GetMapping({"/game/score", "/game/{name}/score"})
    public ResponseEntity<?> game(@AuthenticationPrincipal UserDetails userDetails,
                                  @PathVariable(required = false) String name,
                                  @PageableDefault(
                                          sort = "createdAt",
                                          direction = Sort.Direction.DESC
                                  ) Pageable pageable) {
        return name != null ? ResponseEntity.ok(userService.showProfile(userDetails, pageable, name))
                : ResponseEntity.ok(userService.showProfile(userDetails, pageable));
    }

    @GetMapping({"/game/best", "/game/{name}/best"})
    public ResponseEntity<?> game(@AuthenticationPrincipal UserDetails userDetails,
                                  @PathVariable(required = false) String name) {
        return name != null ? ResponseEntity.ok(userService.showBestGameRecord(userDetails, name))
                : ResponseEntity.ok(userService.showBestGameRecord(userDetails));
    }
}
