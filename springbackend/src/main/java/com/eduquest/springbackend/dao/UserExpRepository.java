package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserExp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserExpRepository extends JpaRepository<UserExp,Long> {
}
