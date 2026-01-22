package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Exp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpRepository extends JpaRepository<Exp, Long> {
}
