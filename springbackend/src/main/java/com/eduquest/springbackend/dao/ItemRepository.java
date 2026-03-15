package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> getReferenceByName(String name);
}
