package com.bus.occupancy.system.exception;

import com.bus.occupancy.system.dto.ErrorResponseDTO;
import com.bus.occupancy.system.model.ErrorLog;
import com.bus.occupancy.system.service.ErrorLogService;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ErrorLogService errorLogService;

    public GlobalExceptionHandler(ErrorLogService errorLogService) {
        this.errorLogService = errorLogService;
    }

    // ===== Genel domain hataları =====

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleEntityNotFound(EntityNotFoundException ex) {
        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.ENTITY_NOT_FOUND,
                ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PasswordException.class)
    public ResponseEntity<ErrorResponseDTO> handlePasswordIncorrect(PasswordException ex) {
        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.PASSWORD_WRONG,
                ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(EntityExistsException.class)
    public ResponseEntity<ErrorResponseDTO> handleEntityAlreadyExists(EntityExistsException ex) {
        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.ENTITY_EXISTS,
                ex.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(RequestNotPermitted.class)
    public ResponseEntity<ErrorResponseDTO> handleRateLimitExceeded(RequestNotPermitted ex) {
        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
                "Cok fazla istek. Lutfen kisa bir sure bekleyip tekrar deneyin.",
                HttpStatus.TOO_MANY_REQUESTS);
    }

    // ===== Validation hataları =====

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        // Cihaz endpoint'inden gelen @Valid hataları ErrorLog'a yazılır
        if (isDeviceEndpoint(request)) {
            errorLogService.save(
                    extractField(ex, "cameraId"),
                    extractBusId(ex),
                    extractRawBody(request),
                    ErrorLog.ErrorType.VALIDATION_ERROR,
                    message,
                    request.getRequestURI()
            );
        }

        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining(", "));
        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
    }

    /**
     * Bozuk JSON veya geçersiz enum değeri geldiğinde Jackson bu exception'ı fırlatır.
     * Cihaz endpoint'inden geliyorsa rawPayload ile birlikte ErrorLog'a yazılır.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleMalformedJson(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        String message = "Gecersiz veya parse edilemeyen JSON gövdesi: " + rootCause(ex);

        if (isDeviceEndpoint(request)) {
            errorLogService.save(
                    null,
                    null,
                    extractRawBody(request),
                    ErrorLog.ErrorType.MALFORMED_JSON,
                    message,
                    request.getRequestURI()
            );
        }

        return buildResponse(ErrorResponseDTO.ErrorCodeEnum.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
    }

    // ===== Yardimci metodlar =====

    private boolean isDeviceEndpoint(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/v1/device");
    }

    private String extractRawBody(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            byte[] bytes = wrapper.getContentAsByteArray();
            if (bytes.length > 0) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
        }
        return "(body okunamadi)";
    }

    private String extractField(MethodArgumentNotValidException ex, String fieldName) {
        return ex.getBindingResult().getFieldErrors().stream()
                .filter(e -> fieldName.equals(e.getField()))
                .findFirst()
                .map(e -> String.valueOf(e.getRejectedValue()))
                .orElse(null);
    }

    private Long extractBusId(MethodArgumentNotValidException ex) {
        try {
            String raw = ex.getBindingResult().getFieldErrors().stream()
                    .filter(e -> "busId".equals(e.getField()))
                    .findFirst()
                    .map(e -> String.valueOf(e.getRejectedValue()))
                    .orElse(null);
            return raw != null ? Long.parseLong(raw) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String rootCause(Exception ex) {
        Throwable cause = ex;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : ex.getMessage();
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(ErrorResponseDTO.ErrorCodeEnum code,
                                                            String message,
                                                            HttpStatus status) {
        return new ResponseEntity<>(
                new ErrorResponseDTO(new ErrorResponseDTO.ErrorCode(code, message), LocalDateTime.now()),
                status
        );
    }
}
