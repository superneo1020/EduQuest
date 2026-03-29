package com.eduquest.springbackend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "class_members")
public class ClassMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "role_in_class", length = 20, nullable = false)
    private String roleInClass;

    public ClassMember() {}

    public ClassMember(SchoolClass schoolClass, AppUser user, String roleInClass) {
        this.schoolClass = schoolClass;
        this.user = user;
        this.roleInClass = roleInClass;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SchoolClass getSchoolClass() {
        return schoolClass;
    }

    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
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
