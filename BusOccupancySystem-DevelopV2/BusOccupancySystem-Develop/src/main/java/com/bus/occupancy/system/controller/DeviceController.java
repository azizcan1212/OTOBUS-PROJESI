package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.dto.DeviceInputDTO;
import com.bus.occupancy.system.dto.ErrorResponseDTO;
import com.bus.occupancy.system.exception.DeviceValidationException;
import com.bus.occupancy.system.service.DeviceValidationService;
import com.bus.occupancy.system.service.ErrorLogService;
import com.bus.occupancy.system.service.VerificationService;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;

@RestController
@RequestMapping("${api.root}/device")
@Tag(name = "Device Input", description = "Kamera / AI cihazından gelen veri girişi ve doğrulama pipeline'ı")
public class DeviceController {

    private static final Logger log = LoggerFactory.getLogger(DeviceController.class);

    // Ayni cihazdan (cameraId) dakikada en fazla 5 istek - tunel/AI tarafinin tek bir
    // cihazi spam'lemesine karsi ek koruma (deviceInputRateLimiter zaten genel limiti uyguluyor)
    private static final RateLimiterConfig PER_DEVICE_RATE_LIMITER_CONFIG = RateLimiterConfig.custom()
            .limitForPeriod(5)
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .timeoutDuration(Duration.ZERO)
            .build();

    private final DeviceValidationService deviceValidationService;
    private final VerificationService verificationService;
    private final ErrorLogService errorLogService;
    private final RateLimiterRegistry rateLimiterRegistry;

    public DeviceController(DeviceValidationService deviceValidationService,
                             VerificationService verificationService,
                             ErrorLogService errorLogService,
                             RateLimiterRegistry rateLimiterRegistry) {
        this.deviceValidationService = deviceValidationService;
        this.verificationService = verificationService;
        this.errorLogService = errorLogService;
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    @Operation(
            summary = "Cihaz verisi gönder",
            description = """
                    Kamera / AI sisteminden gelen ham otobüs verisini alır.

                    Yetkilendirme: ADMIN veya DEVICE rolüne sahip bir JWT token gerekir
                    (Authorization: Bearer <token>). Token, /api/v1/auth/login ile alınır.

                    Pipeline:
                    1. @Valid → şema doğrulaması (alan varlığı, enum, format)
                    2. DeviceValidationService → iş kuralı doğrulaması
                    3. VerificationService → doluluk güncelleme + WebSocket yayını

                    Başarısız her istek ErrorLog tablosuna ham payload ile kaydedilir.

                    TEST SENARYOLARI:
                    - ✅ Geçerli istek → 204, occupancy_logs'a yazar
                    - ❌ Kamera arızalı (ERROR + passengerCount>0) → 422, error_logs'a yazar
                    - ❌ Bakımda otobüs (MAINTENANCE + passengerCount>0) → 422, error_logs'a yazar
                    - ❌ Olmayan busId → 422, error_logs'a yazar
                    - ❌ Eksik alan → 400, error_logs'a yazar
                    """,
            requestBody = @RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = DeviceInputDTO.class),
                            examples = {
                                    @ExampleObject(
                                            name = "✅ Geçerli istek",
                                            summary = "Normal çalışan kamera — 204 döner, occupancy_logs'a yazar",
                                            value = """
                                                    {
                                                      "cameraId": "CAM-BUS34-001",
                                                      "busId": 1,
                                                      "cameraStatus": "ACTIVE",
                                                      "busStatus": "RUNNING",
                                                      "timestamp": "2024-06-03T14:30:00+03:00",
                                                      "passengerCount": 23,
                                                      "driverName": "Mehmet Yilmaz"
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "❌ Kamera arızalı (ERROR)",
                                            summary = "Kamera arızalıyken passengerCount gönderilmiş — 422 döner, error_logs'a yazar",
                                            value = """
                                                    {
                                                      "cameraId": "CAM-BUS34-001",
                                                      "busId": 1,
                                                      "cameraStatus": "ERROR",
                                                      "busStatus": "RUNNING",
                                                      "timestamp": "2024-06-03T14:30:00+03:00",
                                                      "passengerCount": 15
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "❌ Otobüs bakımda (MAINTENANCE)",
                                            summary = "Bakımdaki otobüsten yolcu verisi gelmiş — 422 döner, error_logs'a yazar",
                                            value = """
                                                    {
                                                      "cameraId": "CAM-BUS34-002",
                                                      "busId": 2,
                                                      "cameraStatus": "ACTIVE",
                                                      "busStatus": "MAINTENANCE",
                                                      "timestamp": "2024-06-03T14:30:00+03:00",
                                                      "passengerCount": 5
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "❌ Olmayan otobüs ID",
                                            summary = "DB'de kayıtlı olmayan busId — 422 döner, error_logs'a yazar",
                                            value = """
                                                    {
                                                      "cameraId": "CAM-BUS99-001",
                                                      "busId": 9999,
                                                      "cameraStatus": "ACTIVE",
                                                      "busStatus": "RUNNING",
                                                      "timestamp": "2024-06-03T14:30:00+03:00",
                                                      "passengerCount": 10
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "❌ Eksik alan (cameraId yok)",
                                            summary = "Zorunlu alan eksik — 400 döner, error_logs'a yazar",
                                            value = """
                                                    {
                                                      "busId": 1,
                                                      "cameraStatus": "ACTIVE",
                                                      "busStatus": "RUNNING",
                                                      "timestamp": "2024-06-03T14:30:00+03:00",
                                                      "passengerCount": 20
                                                    }
                                                    """
                                    )
                            }
                    )
            )
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Veri basariyla islendi. occupancy_logs'a yazildi."),
            @ApiResponse(responseCode = "400", description = "Sema hatasi — eksik alan veya format. error_logs'a yazildi."),
            @ApiResponse(responseCode = "422", description = "Is kurali hatasi — kamera/otubus tutarsizligi. error_logs'a yazildi."),
            @ApiResponse(responseCode = "401", description = "JWT token gerekli (ADMIN veya DEVICE rolu)."),
            @ApiResponse(responseCode = "429", description = "Rate limit asildi: genel limit (saniyede 20) veya cihaz basina dakikada 5 istek.")
    })
    @PostMapping("/input")
    @RateLimiter(name = "deviceInputRateLimiter", fallbackMethod = "deviceInputRateLimitFallback")
    public ResponseEntity<?> submitDeviceInput(
            @Valid @org.springframework.web.bind.annotation.RequestBody DeviceInputDTO dto,
            HttpServletRequest request) {

        io.github.resilience4j.ratelimiter.RateLimiter perDeviceLimiter = rateLimiterRegistry
                .rateLimiter("device-input-" + dto.cameraId(), PER_DEVICE_RATE_LIMITER_CONFIG);
        if (!perDeviceLimiter.acquirePermission()) {
            ErrorResponseDTO error = new ErrorResponseDTO(
                    new ErrorResponseDTO.ErrorCode(
                            ErrorResponseDTO.ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
                            "Bu cihazdan (cameraId) dakikada en fazla 5 istek gonderilebilir."),
                    LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
        }

        try {
            deviceValidationService.validate(dto);
        } catch (DeviceValidationException ex) {
            errorLogService.save(
                    dto.cameraId(),
                    dto.busId(),
                    extractRawBody(request),
                    ex.getErrorType(),
                    ex.getMessage(),
                    request.getRequestURI()
            );
            return ResponseEntity.unprocessableEntity().build();
        }

        verificationService.process(dto);
        return ResponseEntity.noContent().build();
    }

    // Tunel uzerinden gelen cihaz/AI trafigi limiti asarsa 429 + ErrorResponseDTO doner
    public ResponseEntity<ErrorResponseDTO> deviceInputRateLimitFallback(
            DeviceInputDTO dto, HttpServletRequest request, RequestNotPermitted ex) {
        ErrorResponseDTO error = new ErrorResponseDTO(
                new ErrorResponseDTO.ErrorCode(
                        ErrorResponseDTO.ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
                        "Cok fazla cihaz verisi gonderildi. Saniyede maksimum 20 istek izin verilir."),
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }

    private String extractRawBody(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            byte[] content = wrapper.getContentAsByteArray();
            if (content.length > 0) {
                return new String(content, StandardCharsets.UTF_8);
            }
        }
        return "(body okunamadi)";
    }
}
