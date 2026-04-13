package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.EducatorService;
import com.eduquest.springbackend.service.UserGameScoreService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/educator")
public class EducatorController {

    private final EducatorService educatorService;
    private final UserGameScoreService userGameScoreService;

    public EducatorController(EducatorService educatorService, UserGameScoreService userGameScoreService) {
        this.educatorService = educatorService;
        this.userGameScoreService = userGameScoreService;
    }

    @GetMapping("/school/members")
    public ResponseEntity<UtilPageResponse<UserMiniDto>> showCourseMembers(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(educatorService.showAllSchoolMembers(userDetails.getId(), pageable));
    }

    @GetMapping("/class/{courseId}/members/potential")
    @PreAuthorize("@courseSecurity.isCourseExists(#courseId) && " +
            "@courseMemberSecurity.isCourseMember(#courseId) && " +
            "@courseSecurity.isCourseSameSchool(#courseId)")
    public ResponseEntity<UtilPageResponse<UserMiniDto>> showPotentialCourseMembers(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable Long courseId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(educatorService.showAllPotentialSchoolMembers(userDetails.getId(), courseId, pageable));
    }

    @GetMapping("/class")
    public ResponseEntity<UtilDetailedListResponse<CourseDto>> showAllCourse(
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return ResponseEntity.ok(educatorService.showAllCourse(userDetails.getId()));
    }

    @PostMapping("/class")
    public ResponseEntity<Map<String, Record>> createCourse(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody CourseRequest request
    ) {
        return ResponseEntity.ok(educatorService.createCourse(request, userDetails.getId()));
    }

    @DeleteMapping("/class/{courseId}")
    @PreAuthorize("@courseSecurity.isCourseExists(#courseId) && " +
            "@courseMemberSecurity.isCourseMember(#courseId) && " +
            "@courseSecurity.isCourseSameSchool(#courseId)")
    public ResponseEntity<OperationResult> removeCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(educatorService.removeCourse(courseId));
    }

    @PostMapping("/class/member")
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#request.userId) && " +
            "!@courseMemberSecurity.isCourseMember(#request.courseId, #request.userId) && " +
            "@courseMemberSecurity.isCourseMember(#request.courseId) && " +
            "@courseMemberSecurity.isCourseStaff(#request.courseId)")
    public ResponseEntity<CourseMemberResponse> addCourseMember(@Valid @RequestBody CourseMemberRequest request) {
        return ResponseEntity.ok(educatorService.addCourseMember(request));
    }

    @PatchMapping("/class/member")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#request.courseId, #request.userId) && " +
            "@courseMemberSecurity.isCourseMember(#request.courseId) && " +
            "@courseMemberSecurity.isCourseStaff(#request.courseId)")
    public ResponseEntity<OperationResult> updateCourseMember(@Valid @RequestBody CourseMemberRequest request) {
        return ResponseEntity.ok(educatorService.updateCourseMember(request));
    }

    @DeleteMapping("/class/{courseId}/member/{userId}")
    @PreAuthorize("(@courseMemberSecurity.isAvailableModifyTeacher(#courseId) && " +
            "@courseMemberSecurity.isCourseStaff(#courseId, #userId)) && " +
            "@courseMemberSecurity.isCourseMember(#courseId, #userId) && " +
            "@courseMemberSecurity.isCourseStaff(#courseId)")
    public ResponseEntity<OperationResult> removeCourseMember(
            @PathVariable Long courseId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(educatorService.removeCourseMember(courseId, userId));
    }

    @GetMapping({"student/{userId}/game/score", "student/{userId}/game/{name}/score"})
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#userId)")
    public ResponseEntity<?> getMyGameScore(
            @PathVariable Long userId,
            @PathVariable(required = false) String name,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showGameRecord(userId, pageable, name))
                : ResponseEntity.ok(userGameScoreService.showGameRecord(userId, pageable));
    }

    @GetMapping({"student/{userId}/game/best", "student/{userId}/game/{name}/best"})
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#userId)")
    public ResponseEntity<?> getMyBestGameScore(
            @PathVariable Long userId,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showBestGameRecord(userId, name))
                : ResponseEntity.ok(userGameScoreService.showBestGameRecord(userId));
    }
}
