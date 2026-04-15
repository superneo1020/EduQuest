package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.AdminFilterForUserRequest;
import com.eduquest.springbackend.dto.AdminFilterForUserResponse;
import com.eduquest.springbackend.dto.OperationResult;
import com.eduquest.springbackend.dto.UtilPageResponse;
import com.eduquest.springbackend.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/filter/user")
    public ResponseEntity<UtilPageResponse<AdminFilterForUserResponse>> findAllUserByFilter(
            @Valid AdminFilterForUserRequest req,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.findAllUserByFilter(req, pageable));
    }

    @PatchMapping("/user/{id}/activate")
    public ResponseEntity<OperationResult> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.activateUser(id));
    }

    @PatchMapping("/user/{id}/reject")
    public ResponseEntity<OperationResult> rejectEducator(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.rejectEducator(id));
    }

    @GetMapping("/user/game/count")
    public ResponseEntity<Long> countAllUserGameScore() {
        return ResponseEntity.ok(adminService.countAllUserGameScore());
    }
}
