package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.CourseRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.service.AppUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("courseSecurity")
public class CourseSecurity {

    private final CourseRepository courseRepo;
    private final UserRepository userRepo;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public CourseSecurity(CourseRepository courseRepo, UserRepository userRepo) {
        this.courseRepo = courseRepo;
        this.userRepo = userRepo;
    }

    public AppUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails user) {
            return user;
        }
        return null;
    }

    public boolean isCourseExists(Long courseId) {
        boolean isExists = courseRepo.existsById(courseId);
        if (!isExists) {
            logger.info("Access Denied: Course not found");
        }
        return isExists;
    }

    public boolean isCourseSameSchool(Long courseId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;

        Long userSchoolId = userRepo.findSchoolIdById(user.getId()).orElse(null);
        if (userSchoolId == null) return false;

        boolean isSame = courseRepo.existsByIdAndSchoolId(courseId, userSchoolId);

        if (!isSame) {
            logger.info("Access Denied: User {} is not in the same school as course {}", user.getId(), courseId);
        }

        return isSame;
    }
}
