package com.eduquest.springbackend.model;

import jakarta.persistence.*;

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

    @Column(length = 20, nullable = false)
    private String roleInClass;

    public CourseMember() {}

    public CourseMember(Course course, AppUser user, String roleInClass) {
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

    public String getRoleInClass() {
        return roleInClass;
    }

    public void setRoleInClass(String roleInClass) {
        this.roleInClass = roleInClass;
    }
}
