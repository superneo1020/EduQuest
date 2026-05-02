package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.EducatorAiAnalysisService;
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
    private final EducatorAiAnalysisService educatorAiAnalysisService;
    private final UserGameScoreService userGameScoreService;

    public EducatorController(
            EducatorService educatorService,
            EducatorAiAnalysisService educatorAiAnalysisService,
            UserGameScoreService userGameScoreService
    ) {
        this.educatorService = educatorService;
        this.educatorAiAnalysisService = educatorAiAnalysisService;
        this.userGameScoreService = userGameScoreService;
    }

    /**
     * Retrieves all users within the educator's school.
     * Useful for looking up potential members to add to a class.
     */
    @GetMapping("/school/members")
    public ResponseEntity<UtilPageResponse<UserMiniDto>> showCourseMembers(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(educatorService.showAllSchoolMembers(userDetails.getId(), pageable));
    }

    /**
     * Lists school members who are eligible to join a specific course.
     */
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

    /**
     * Retrieves a detailed list of all courses the current user is associated with.
     */
    @GetMapping("/class")
    public ResponseEntity<UtilDetailedListResponse<CourseDto>> showAllCourse(
            @AuthenticationPrincipal AppUserDetails userDetails
    ) {
        return ResponseEntity.ok(educatorService.showAllCourse(userDetails.getId()));
    }

    /**
     * Creates a new course and assigns the creator as the head teacher.
     */
    @PostMapping("/class")
    public ResponseEntity<Map<String, Record>> createCourse(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody CourseRequest request
    ) {
        return ResponseEntity.ok(educatorService.createCourse(request, userDetails.getId()));
    }

    /**
     * Deletes a course.
     * Restricted to head teachers; prevents deletion if it would leave the course orphaned.
     */
    @DeleteMapping("/class/{courseId}")
    @PreAuthorize("@courseSecurity.isCourseExists(#courseId) && " +
            "@courseMemberSecurity.canDeleteClass(#courseId) && " +
            "@courseSecurity.isCourseSameSchool(#courseId)")
    public ResponseEntity<OperationResult> removeCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(educatorService.removeCourse(courseId));
    }

    /**
     * Adds a new member (student or staff) to a course.
     */
    @PostMapping("/class/member")
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#request.userId) && " +
            "!@courseMemberSecurity.isCourseMember(#request.courseId, #request.userId) && " +
            "@courseMemberSecurity.isCourseStaff(#request.courseId)")
    public ResponseEntity<CourseMemberResponse> addCourseMember(@Valid @RequestBody CourseMemberRequest request) {
        return ResponseEntity.ok(educatorService.addCourseMember(request));
    }

    /**
     * Updates a member's role within a course.
     */
    @PatchMapping("/class/member")
    @PreAuthorize("@courseMemberSecurity.canChangeRoles(#request.courseId, #request.role) && " +
            "@courseMemberSecurity.isCourseMember(#request.courseId, #request.userId) && " +
            "@courseMemberSecurity.isCourseStaff(#request.courseId)")
    public ResponseEntity<OperationResult> updateCourseMember(@Valid @RequestBody CourseMemberRequest request) {
        return ResponseEntity.ok(educatorService.updateCourseMember(request));
    }

    /**
     * Removes a specific member from a course.
     */
    @DeleteMapping("/class/{courseId}/member/{userId}")
    @PreAuthorize("@courseMemberSecurity.canDeleteMember(#courseId, #userId) && " +
            "@courseMemberSecurity.isCourseMember(#courseId, #userId) && " +
            "@courseMemberSecurity.isCourseStaff(#courseId)")
    public ResponseEntity<OperationResult> removeCourseMember(
            @PathVariable Long courseId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(educatorService.removeCourseMember(courseId, userId));
    }

    /**
     * Retrieves the history of game scores for all students enrolled in the course.
     */
    @GetMapping("/class/{courseId}/game/score")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#courseId)")
    public ResponseEntity<?> showAllCourseMembersGameRecord(
            @PathVariable Long courseId,
            @PageableDefault(
                    size = 100,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showAllGameRecordByCourseId(courseId, pageable));
    }

    /**
     * Generates an AI analysis of recent performance trends for the entire class.
     */
    @GetMapping("/class/{courseId}/game/score/result")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#courseId)")
    public ResponseEntity<?> aiAnalysisAllCourseMembersGameRecord(
            @PathVariable Long courseId,
            @PageableDefault(size = 100) Pageable pageable
    ) {
        return ResponseEntity.ok(educatorAiAnalysisService.analysisRecentProgressForCourse(courseId, pageable));
    }

    /**
     * Fetches game scores for a specific student, optionally filtered by game name.
     */
    @GetMapping({"student/{userId}/game/score", "student/{userId}/game/{name}/score"})
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#userId)")
    public ResponseEntity<?> getStudentGameScore(
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

    /**
     * Fetches best game scores for a specific student, optionally filtered by game name.
     */
    @GetMapping({"student/{userId}/game/best", "student/{userId}/game/{name}/best"})
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#userId)")
    public ResponseEntity<?> getStudentBestGameScore(
            @PathVariable Long userId,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showBestGameRecord(userId, name))
                : ResponseEntity.ok(userGameScoreService.showBestGameRecord(userId));
    }

    /**
     * Generates an AI analysis of recent performance trends of a specific game (or all games) for a specific student.
     */
    @GetMapping({"student/{userId}/game/result", "student/{userId}/game/{gameId}/result"})
    @PreAuthorize("@userSecurity.isBothUserSameSchool(#userId)")
    public ResponseEntity<?> aiAnalysisStudentGameScore(
            @PathVariable Long userId,
            @PathVariable(required = false) Long gameId,
            @PageableDefault(
                    size = 100,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return gameId != null
                ? ResponseEntity.ok(educatorAiAnalysisService.analyzeStudentGameProgress(userId, gameId, pageable))
                : ResponseEntity.ok(educatorAiAnalysisService.analyzeStudentGameProgress(userId, pageable));
    }
}
