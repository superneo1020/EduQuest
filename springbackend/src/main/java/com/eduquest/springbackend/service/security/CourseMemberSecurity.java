package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import org.springframework.stereotype.Component;

@Component("courseMemberSecurity")
public class CourseMemberSecurity {

    private final CourseMemberRepository courseMemberRepo;

    public CourseMemberSecurity(CourseMemberRepository courseMemberRepo) {
        this.courseMemberRepo = courseMemberRepo;
    }

    public boolean isMember(Long courseId, Long userId) {
        return courseMemberRepo.existsByCourseIdAndUserId(courseId, userId);
    }
}
