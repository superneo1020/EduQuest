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

    private final UserService userService;

    public CourseMemberService(CourseMemberRepository courseMemberRepo, UserService userService) {
        this.courseMemberRepo = courseMemberRepo;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<CourseDto> showAllCourse(String username) {
        Long id = userService.checkIdByUsername(username);
        return courseMemberRepo.findCourseByUserId(id);
    }

    @Transactional(readOnly = true)
    public List<CourseMemberDto> showAllCourseMemberByCourseId(String username, Long courseId) {
        Long userId = userService.checkIdByUsername(username);
        return courseMemberRepo.findUserByCourseId(userId, courseId);
    }

    @Transactional(readOnly = true)
    public String showRoleInClassByUserIdAndCourseId(String username, Long courseId) {
        Long userId = userService.checkIdByUsername(username);
        return courseMemberRepo.findRoleInClassByUserIdAndCourseId(userId, courseId).orElse(null);
    }
}
