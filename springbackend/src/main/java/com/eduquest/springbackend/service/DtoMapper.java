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

    public <T> PageResponse<T> toPageResponse(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getPageable().getPageNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    public <T> SliceResponse<T> toSliceResponse(Slice<T> slice) {
        return new  SliceResponse<>(
                slice.getContent(),
                slice.getPageable().getPageNumber(),
                slice.hasNext(),
                slice.hasPrevious()
        );
    }
}
