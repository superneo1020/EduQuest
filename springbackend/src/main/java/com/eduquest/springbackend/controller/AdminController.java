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

    /**
     * Searches for users across the system using dynamic filters and pagination.
     */
    @GetMapping("/filter/user")
    public ResponseEntity<UtilPageResponse<AdminFilterForUserResponse>> findAllUserByFilter(
            @Valid AdminFilterForUserRequest req,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.findAllUserByFilter(req, pageable));
    }

    /**
     * Activates a user account, typically used for approving new registrations.
     */
    @PatchMapping("/user/{id}/activate")
    public ResponseEntity<OperationResult> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.activateUser(id));
    }

    /**
     * Rejects an educator's application and prevents account activation.
     */
    @PatchMapping("/user/{id}/reject")
    public ResponseEntity<OperationResult> rejectEducator(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.rejectEducator(id));
    }

    /**
     * Returns the total count of game records across the entire platform for analytics.
     */
    @GetMapping("/user/game/count")
    public ResponseEntity<Long> countAllUserGameScore() {
        return ResponseEntity.ok(adminService.countAllUserGameScore());
    }
}
