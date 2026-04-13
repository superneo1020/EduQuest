package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.dao.CourseRepository;
import com.eduquest.springbackend.dao.SchoolRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.enums.RoleInClass;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Course;
import com.eduquest.springbackend.model.CourseMember;
import com.eduquest.springbackend.model.School;
import com.eduquest.springbackend.util.PageableUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

@Service
@PreAuthorize("hasRole('EDUCATOR')")
public class EducatorService {

    private final Set<String> SCHOOL_MEMBER_DTO_FIELD = Set.of(
            "id", "name", "email"
    );

    private final UserRepository userRepo;
    private final CourseRepository courseRepo;
    private final CourseMemberRepository courseMemberRepo;
    private final SchoolRepository schoolRepo;
    private final DtoMapper dtoMapper;

    public EducatorService(UserRepository userRepo,
                           CourseRepository courseRepo,
                           CourseMemberRepository courseMemberRepo,
                           SchoolRepository schoolRepo,
                           DtoMapper dtoMapper) {
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.courseMemberRepo = courseMemberRepo;
        this.schoolRepo = schoolRepo;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserMiniDto> showAllSchoolMembers(Long userId, Pageable pageable) {
        Pageable cleanedPageable = PageableUtils.filterSort(pageable, SCHOOL_MEMBER_DTO_FIELD);
        return dtoMapper.toPageResponse(userRepo.findAllUserRecordByIdWithSchool(userId, cleanedPageable));
    }

    @Transactional(readOnly = true)
    public UtilDetailedListResponse<CourseDto> showAllCourse(Long userId) {
        return dtoMapper.toDetailedListResponse(courseRepo.findAllAvailableCoursesByHomeSchool(userId));
    }

    @Transactional
    public Map<String, Record> createCourse(CourseRequest req, Long userId) {
        School school = schoolRepo.findByUserId(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        if (courseRepo.existsBySchoolAndGradeAndSuffixAndAcademicYear(school, req.grade(), req.suffix(), req.academicYear())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course already exists");
        }

        Course course = new Course(school, req.grade(), req.suffix(), req.academicYear());
        Course savedCourse = courseRepo.save(course);
        CourseResponse courseResponse = new CourseResponse(
                savedCourse.getId(),
                savedCourse.getGrade(),
                savedCourse.getSuffix(),
                savedCourse.getAcademicYear(),
                savedCourse.getCreatedAt()
        );

        AppUser user = userRepo.getReferenceById(userId);

        CourseMember courseMember = new CourseMember(savedCourse, user, RoleInClass.TEACHER);
        CourseMember savedCourseMember = courseMemberRepo.save(courseMember);
        CourseMemberResponse courseMemberResponse = new CourseMemberResponse(
                savedCourseMember.getId(),
                savedCourseMember.getUser().getId(),
                savedCourseMember.getCourse().getId(),
                savedCourseMember.getRoleInClass()
        );

        return Map.of(
                "course", courseResponse,
                "courseMember", courseMemberResponse
        );
    }

    @Transactional
    public OperationResult removeCourse(Long courseId) {
        courseRepo.deleteById(courseId);
        return new OperationResult("Course removed successfully.", false);
    }

    @Transactional
    public CourseMemberResponse addCourseMember(CourseMemberRequest req) {
        AppUser user = userRepo.getReferenceById(req.userId());
        Course course = courseRepo.getReferenceById(req.courseId());

        CourseMember courseMember = new CourseMember(course, user, req.role());
        CourseMember savedMember = courseMemberRepo.save(courseMember);

        return new CourseMemberResponse(
                savedMember.getId(),
                savedMember.getUser().getId(),
                savedMember.getCourse().getId(),
                savedMember.getRoleInClass()
        );
    }

    @Transactional
    public OperationResult updateCourseMember(CourseMemberRequest req) {
        CourseMember courseMember = courseMemberRepo.findByCourseIdAndUserId(req.courseId(), req.userId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Course Member not found"));

        // If changing a TEACHER to something else, check if they are the last captain of the ship
        if (courseMember.getRoleInClass() == RoleInClass.TEACHER && req.role() != RoleInClass.TEACHER) {
            if (courseMemberRepo.countByCourseIdAndRoleInClass(req.courseId(), RoleInClass.TEACHER) <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot demote yourself: You are the last teacher in this class.");
            }
        }

        courseMember.setRoleInClass(req.role());
        return new OperationResult("Course Member updated successfully.", false);
    }

    @Transactional
    public OperationResult removeCourseMember(Long courseId, Long userId) {
        long rowsDeleted = courseMemberRepo.deleteByCourseIdAndUserId(courseId, userId);

        if (rowsDeleted > 0) {
            return new OperationResult("Course Member removed successfully.", false);
        } else {
            return new OperationResult("Course Member not found or already removed.", true);
        }
    }
}
