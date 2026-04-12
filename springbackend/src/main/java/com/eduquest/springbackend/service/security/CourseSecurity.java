package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.CourseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("courseSecurity")
public class CourseSecurity {

    private final CourseRepository courseRepo;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public CourseSecurity(CourseRepository courseRepo) {
        this.courseRepo = courseRepo;
    }

    public boolean isCourseExists(Long courseId) {
        boolean isExists = courseRepo.existsById(courseId);
        if (!isExists) {
            logger.info("Course not found");
        }
        return isExists;
    }
}
