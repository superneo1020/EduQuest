package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.service.AppUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("courseMemberSecurity")
public class CourseMemberSecurity {

    private final CourseMemberRepository courseMemberRepo;

    public CourseMemberSecurity(CourseMemberRepository courseMemberRepo) {
        this.courseMemberRepo = courseMemberRepo;
    }

    public boolean isCourseMember(Long courseId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserDetails user)) {
            return false;
        }
        return courseMemberRepo.existsByCourseIdAndUserId(courseId, user.getId());
    }
}
