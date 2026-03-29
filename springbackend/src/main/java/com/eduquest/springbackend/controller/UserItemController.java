package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserItemRequest;
import com.eduquest.springbackend.service.UserItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/item")
public class UserItemController {

    private final UserItemService userItemService;

    public UserItemController(UserItemService userItemService) {
        this.userItemService = userItemService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getMyItem(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userItemService.showItem(userDetails.getUsername()));
    }

    @PostMapping("/")
    public ResponseEntity<?> createMyItem(
            @AuthenticationPrincipal UserDetails userDetails,
            UserItemRequest request
    ) {
        return ResponseEntity.ok(userItemService.createUserItem(userDetails.getUsername(), request));
    }
}
