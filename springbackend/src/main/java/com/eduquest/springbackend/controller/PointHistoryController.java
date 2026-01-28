package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dao.PointHistoryRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.PointHistory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/points")
public class PointHistoryController {

    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

    public PointHistoryController(PointHistoryRepository pointHistoryRepository, UserRepository userRepository) {
        this.pointHistoryRepository = pointHistoryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/history")
    public ResponseEntity<List<PointHistory>> getMyHistory(@AuthenticationPrincipal UserDetails userDetails) {
        // Find the current user based on the token
        AppUser user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Retrieve all of this user's points records from the repository.
        List<PointHistory> historyList = pointHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());


        return ResponseEntity.ok(historyList);
    }
}
