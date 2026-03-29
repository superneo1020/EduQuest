package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.ItemStoreRequest;
import com.eduquest.springbackend.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/item")
public class ItemController {
    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping("/find")
    public ResponseEntity<?> findItems(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid ItemStoreRequest req,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(itemService.findItemByFilter(req, userDetails.getUsername(), pageable));
    }
}
