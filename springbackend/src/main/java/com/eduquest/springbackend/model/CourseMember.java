package com.eduquest.springbackend.model;

import com.eduquest.springbackend.enums.RoleInClass;
import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

@Entity
@Table(name = "class_members")
public class CourseMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private RoleInClass roleInClass;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant updatedAt;

    public CourseMember() {}

    public CourseMember(Course course, AppUser user, RoleInClass roleInClass) {
        this.course = course;
        this.user = user;
        this.roleInClass = roleInClass;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public RoleInClass getRoleInClass() {
        return roleInClass;
    }

    public void setRoleInClass(RoleInClass roleInClass) {
        this.roleInClass = roleInClass;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
