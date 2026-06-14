package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.CameraStatus;
import com.bus.occupancy.system.model.DeviceBusStatus;
import jakarta.validation.constraints.*;

/**
 * Cihaz / AI katmanından gelen ham veri sözleşmesi.
 *
 * Kural 1 (Şema): @Valid anotasyonuyla controller katmanında uygulanır.
 * Kural 2 (İş): DeviceValidationService içinde ek iş kuralları uygulanır.
 * Kural 3 (Ham kayıt): Doğrulama başarısız olsa bile ErrorLog'a yazılır.
 */
public record DeviceInputDTO(

        @NotBlank(message = "cameraId zorunludur ve bos olamaz")
        @Size(max = 50, message = "cameraId en fazla 50 karakter olabilir")
        String cameraId,

        @NotNull(message = "busId zorunludur")
        @Positive(message = "busId pozitif bir sayi olmalidir")
        Long busId,

        // Opsiyonel — gönderilirse format doğrulaması uygulanır
        @Size(max = 100, message = "driverName en fazla 100 karakter olabilir")
        String driverName,

        // Geçersiz bir string gönderilirse Jackson HttpMessageNotReadableException fırlatır
        @NotNull(message = "cameraStatus zorunludur (ACTIVE | INACTIVE | ERROR)")
        CameraStatus cameraStatus,

        @NotNull(message = "busStatus zorunludur (RUNNING | STOPPED | MAINTENANCE)")
        DeviceBusStatus busStatus,

        // ISO 8601 formatı zorunludur: 2024-06-03T14:30:00Z veya +03:00 offset
        @NotBlank(message = "timestamp zorunludur")
        @Pattern(
            regexp = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$",
            message = "timestamp gecerli bir ISO 8601 formati olmalidir " +
                      "(ornek: 2024-06-03T14:30:00Z veya 2024-06-03T14:30:00+03:00)"
        )
        String timestamp,

        // Zorunlu: sistemin amaci doluluk takibi — bu alan olmadan veri anlamsiz
        @NotNull(message = "passengerCount zorunludur")
        @Min(value = 0, message = "passengerCount negatif olamaz")
        @Max(value = 500, message = "passengerCount 500'den buyuk olamaz")
        Integer passengerCount

) {}
