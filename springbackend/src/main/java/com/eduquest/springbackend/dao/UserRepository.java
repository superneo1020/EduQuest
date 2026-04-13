package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.SchoolMemberProfileDto;
import com.eduquest.springbackend.dto.UserAuthDto;
import com.eduquest.springbackend.dto.UserMiniDto;
import com.eduquest.springbackend.enums.EducatorStatus;
import com.eduquest.springbackend.model.AppUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long>, JpaSpecificationExecutor<AppUser> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByIdAndSchoolId(Long userId, Long schoolId);

    @Query("SELECT u.points FROM AppUser u WHERE u.id = :id")
    Optional<Integer> findPointsById(@Param("id") Long userId);

    @Query("SELECT u.school.id FROM AppUser u WHERE u.id = :id")
    Optional<Long> findSchoolIdById(@Param("id") Long userId);

    @Query("SELECT s.name FROM AppUser u JOIN u.school s WHERE u.id = :id")
    Optional<String> findSchoolNameById(@Param("id") Long userId);

    @Query("SELECT u.email FROM AppUser u WHERE u.id = :id")
    Optional<String> findEmailById(@Param("id") Long userId);

    @Query("SELECT new com.eduquest.springbackend.dto.UserAuthDto(u.id, u.username, u.password) " +
            "FROM AppUser u WHERE u.username = :username")
    Optional<UserAuthDto> findAuthInfoByUsername(@Param("username") String username);

    @Query("SELECT r.name FROM AppUser u JOIN u.roles r WHERE u.username = :username")
    Collection<String> findRoleNamesByUsername(@Param("username") String username);

    @Query("SELECT r.name FROM AppUser u JOIN u.roles r WHERE u.id = :id")
    Optional<Collection<String>> findRoleNamesByIdOptional(@Param("id") Long userId);

    @Query("SELECT u.educatorStatus FROM AppUser u WHERE u.id = :id")
    Optional<EducatorStatus> findEducatorStatusById(@Param("id") Long userId);

    @Query("SELECT u.educatorStatus FROM AppUser u WHERE u.username = :username")
    Optional<EducatorStatus> findEducatorStatusByUsername(@Param("username") String username);

    @Query("SELECT u.isActive FROM AppUser u WHERE u.username = :username")
    Optional<Boolean> findIsActiveByUsername(@Param("username") String username);

    @Query("SELECT new com.eduquest.springbackend.dto.UserMiniDto(u.id, u.username, u.email) " +
            "FROM AppUser u " +
            "WHERE u.school.id = (SELECT u.school.id FROM AppUser u WHERE u.id = :id)")
    Page<UserMiniDto> findAllUserRecordByIdWithSchool(@Param("id") Long userId, Pageable pageable);

    @Query("SELECT new com.eduquest.springbackend.dto.SchoolMemberProfileDto" +
            "(u.username, u.userProfile.nickname, u.email, u.userProfile.equippedItems" +
            ") " +
            "FROM AppUser u " +
            "WHERE u.school.id = (SELECT u.school.id FROM AppUser u WHERE u.id = :id)")
    Page<SchoolMemberProfileDto> findAllUserProfileByIdWithSchool(@Param("id") Long userId, Pageable pageable);
}
