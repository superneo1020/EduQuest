package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.dto.CourseMemberDto;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.CourseMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/class")
public class CourseMemberController {
    private final CourseMemberService courseMemberService;

    public CourseMemberController(CourseMemberService courseMemberService) {
        this.courseMemberService = courseMemberService;
    }

    @GetMapping
    public ResponseEntity<List<CourseDto>> showAllCourse(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(courseMemberService.showAllCourse(userDetails.getId()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<CourseMemberDto>> showAllCourseMemberByCourseId(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(courseMemberService.showAllCourseMemberByCourseId(userDetails.getId(), id));
    }

    @GetMapping("/{id}/role")
    public ResponseEntity<String> showRoleInClassByUserIdAndCourseId(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(courseMemberService.showRoleInClassByUserIdAndCourseId(userDetails.getId(), id));
    }
}
