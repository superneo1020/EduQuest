package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserItemRequest;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.UserItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/item")
public class UserItemController {

    private final UserItemService userItemService;

    public UserItemController(UserItemService userItemService) {
        this.userItemService = userItemService;
    }

    /**
     * Retrieves all items owned by the current user.
     * Returns the complete inventory of items purchased by the user.
     */
    @GetMapping
    public ResponseEntity<?> getMyItem(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userItemService.showItem(userDetails.getId()));
    }

    /**
     * Retrieves items of a specific type owned by the current user.
     * Returns filtered inventory based on item type (e.g., avatar, badge, etc.).
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getMyItemByType(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable String type
    ) {
        return ResponseEntity.ok(userItemService.showItemByType(userDetails.getId(), type));
    }

    /**
     * Creates a new item record for the current user.
     * Typically used when a user purchases or receives an item from the shop.
     */
    @PostMapping
    public ResponseEntity<?> createMyItem(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserItemRequest request
    ) {
        return ResponseEntity.ok(userItemService.createUserItem(userDetails.getId(), request));
    }
}
