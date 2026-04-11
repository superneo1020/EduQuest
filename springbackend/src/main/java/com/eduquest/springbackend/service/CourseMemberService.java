package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.dto.CourseMemberDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseMemberService {

    private final CourseMemberRepository courseMemberRepo;

    public CourseMemberService(CourseMemberRepository courseMemberRepo) {
        this.courseMemberRepo = courseMemberRepo;
    }

    @Transactional(readOnly = true)
    public List<CourseDto> showAllCourse(Long userId) {
        return courseMemberRepo.findCourseByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<CourseMemberDto> showAllCourseMembers(Long courseId) {
        return courseMemberRepo.findUserByCourseId(courseId);
    }

    @Transactional(readOnly = true)
    public String getRoleInClass(Long userId, Long courseId) {
        return courseMemberRepo.findRoleInClassByUserIdAndCourseId(userId, courseId).orElse(null);
    }
}
