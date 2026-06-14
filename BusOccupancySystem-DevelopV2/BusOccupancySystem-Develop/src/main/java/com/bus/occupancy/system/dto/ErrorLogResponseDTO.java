package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.ErrorLog;

import java.time.LocalDateTime;

public record ErrorLogResponseDTO(
        Long id,
        String cameraId,
        Long busId,
        String rawPayload,
        ErrorLog.ErrorType errorType,
        String errorMessage,
        String endpoint,
        LocalDateTime createdAt
) {
    public static ErrorLogResponseDTO from(ErrorLog log) {
        return new ErrorLogResponseDTO(
                log.getId(),
                log.getCameraId(),
                log.getBusId(),
                log.getRawPayload(),
                log.getErrorType(),
                log.getErrorMessage(),
                log.getEndpoint(),
                log.getCreatedAt()
        );
    }
}
