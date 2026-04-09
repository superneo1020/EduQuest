package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

@Service
public class DtoMapper {

    public UserDto toUser(AppUser user) {
        return new UserDto(
                user.getUsername(),
                user.getEmail(),
                user.getPoints(),
                user.getRoles().stream().map(Role::getName).toList(),
                user.getSchool() != null ? user.getSchool().getName() : null,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public <T> UtilPageResponse<T> toPageResponse(Page<T> page) {
        return new UtilPageResponse<>(
                page.getContent(),
                page.getPageable().getPageNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    public <T> UtilSliceResponse<T> toSliceResponse(Slice<T> slice) {
        return new UtilSliceResponse<>(
                slice.getContent(),
                slice.getPageable().getPageNumber(),
                slice.hasNext(),
                slice.hasPrevious()
        );
    }
}
