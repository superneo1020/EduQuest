package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.dao.CourseRepository;
import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.dto.CourseMemberDto;
import com.eduquest.springbackend.dto.UtilDetailedListResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseMemberService {

    private final CourseRepository courseRepo;
    private final CourseMemberRepository courseMemberRepo;
    private final DtoMapper dtoMapper;

    public CourseMemberService(CourseRepository courseRepo,
                               CourseMemberRepository courseMemberRepo, DtoMapper dtoMapper) {
        this.courseRepo = courseRepo;
        this.courseMemberRepo = courseMemberRepo;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public UtilDetailedListResponse<CourseDto> showAllCourse(Long userId) {
        return dtoMapper.toDetailedListResponse(courseRepo.findAllCourseByUserId(userId));
    }

    @Transactional(readOnly = true)
    public UtilDetailedListResponse<CourseMemberDto> showAllCourseMembers(Long courseId) {
        return dtoMapper.toDetailedListResponse(courseMemberRepo.findUserByCourseId(courseId));
    }

    @Transactional(readOnly = true)
    public String getRoleInClass(Long userId, Long courseId) {
        return courseMemberRepo.findRoleInClassByUserIdAndCourseId(userId, courseId).orElse(null);
    }
}
