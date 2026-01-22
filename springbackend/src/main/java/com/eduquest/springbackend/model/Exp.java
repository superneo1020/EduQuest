package com.eduquest.springbackend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;

@Entity
@Table(name = "exp")
public class Exp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private Integer value;

    @Column(length = 50)
    private String description;

    @Column(insertable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
    @Generated(event = {EventType.INSERT})
    private Instant createdAt;

    @OneToMany(mappedBy = "exp")
    private Collection<UserExp> userExps = new ArrayList<>();

    public Exp() {}

    public Exp(Integer value, String description) {
        this.value = value;
        this.description = description;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Collection<UserExp> getUserExps() {
        return userExps;
    }

    public void setUserExps(Collection<UserExp> userExps) {
        this.userExps = userExps;
    }
}
