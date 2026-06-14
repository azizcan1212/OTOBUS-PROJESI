package com.bus.occupancy.system.exception;

import com.bus.occupancy.system.model.ErrorLog;

/**
 * DeviceValidationService içinde iş kuralı ihlali tespit edildiğinde fırlatılır.
 * ErrorType alanı ErrorLogService'in doğru kategoriyle kayıt yapmasını sağlar.
 */
public class DeviceValidationException extends RuntimeException {

    private final ErrorLog.ErrorType errorType;

    public DeviceValidationException(String message, ErrorLog.ErrorType errorType) {
        super(message);
        this.errorType = errorType;
    }

    public ErrorLog.ErrorType getErrorType() {
        return errorType;
    }
}
