package com.bus.occupancy.system.mapper;

import com.bus.occupancy.system.dto.UserResponse;
import com.bus.occupancy.system.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "id",       target = "id")
    @Mapping(source = "username", target = "username")
    UserResponse toResponse(User user);
}
