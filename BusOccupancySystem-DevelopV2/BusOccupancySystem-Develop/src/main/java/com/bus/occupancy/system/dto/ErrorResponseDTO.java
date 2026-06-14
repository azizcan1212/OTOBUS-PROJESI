package com.bus.occupancy.system.dto;

import java.time.LocalDateTime;

public record ErrorResponseDTO(
        ErrorCode error,
        LocalDateTime date
) {
    public record ErrorCode(
            ErrorCodeEnum code,
            String message
    ){}
    public enum ErrorCodeEnum {
        PASSWORD_WRONG,
        ENTITY_EXISTS,
        ENTITY_NOT_FOUND,
        TOKEN_INVALID,
        BAD_REQUEST,
        RATE_LIMIT_EXCEEDED
    }
}
