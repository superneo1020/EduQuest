package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.dto.CourseMemberDto;
import com.eduquest.springbackend.dto.UtilDetailedListResponse;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.CourseMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/class")
public class CourseMemberController {
    private final CourseMemberService courseMemberService;

    public CourseMemberController(CourseMemberService courseMemberService) {
        this.courseMemberService = courseMemberService;
    }

    /**
     * Lists all available courses within the user's registered school.
     */
    @GetMapping
    public ResponseEntity<UtilDetailedListResponse<CourseDto>> showAllCourse(
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return ResponseEntity.ok(courseMemberService.showAllCourse(userDetails.getId()));
    }

    /**
     * Retrieves the full roster of members for a specific course.
     */
    @GetMapping("/{id}/members")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#id)")
    public ResponseEntity<UtilDetailedListResponse<CourseMemberDto>> showAllMembersInMyCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseMemberService.showAllCourseMembers(id));
    }

    /**
     * Returns the specific role (e.g., Student, Teacher) of the current user within a course.
     */
    @GetMapping("/{id}/role")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#id)")
    public ResponseEntity<String> showMyRoleInClass(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(courseMemberService.getRoleInClass(userDetails.getId(), id));
    }
}
