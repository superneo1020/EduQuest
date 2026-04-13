package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.UserItemDto;
import com.eduquest.springbackend.model.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserItemRepository extends JpaRepository<UserItem,Long> {
    Boolean existsByUserIdAndItemId(Long userId, Long itemId);

    @Query(value = "SELECT new com.eduquest.springbackend.dto.UserItemDto( " +
            "ui.id, i.id, i.name, i.type, i.icon, i.description, ui.createdAt" +
            ") " +
            "FROM UserItem ui " +
            "JOIN ui.item i " +
            "WHERE ui.user.id = :userId ")
    List<UserItemDto> findAllByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT new com.eduquest.springbackend.dto.UserItemDto( " +
            "ui.id, i.id, i.name, i.type, i.icon, i.description, ui.createdAt" +
            ") " +
            "FROM UserItem ui " +
            "JOIN ui.item i " +
            "WHERE ui.user.id = :userId " +
            "AND i.type = :type ")
    List<UserItemDto> findAllByUserIdAndItemType(@Param("userId") Long userId, @Param("type") String type);
}
