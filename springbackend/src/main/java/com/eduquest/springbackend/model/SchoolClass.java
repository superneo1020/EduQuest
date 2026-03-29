package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

@Entity
@Table(name = "classes")
public class SchoolClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(length = 10, nullable = false)
    private String grade;

    @Column(length = 10, nullable = false)
    private String suffix;

    @Column(length = 10, nullable = false)
    private String academicYear;

    @Column(nullable = false,
            insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    public SchoolClass() {}

    public SchoolClass(School school, String grade, String suffix, String academicYear) {
        this.school = school;
        this.grade = grade;
        this.suffix = suffix;
        this.academicYear = academicYear;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getSuffix() {
        return suffix;
    }

    public void setSuffix(String suffix) {
        this.suffix = suffix;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
