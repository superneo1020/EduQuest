package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    @Query("SELECT u.id FROM Item u WHERE u.name = :name")
    Optional<Long> findIdByName(@Param("name") String name);

    Boolean existsByIdAndType(Long Id, String type);
}
