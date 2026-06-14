package com.bus.occupancy.system.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Doğrulamadan geçemeyen her cihaz/AI isteğinin tam kaydı.
 *
 * rawPayload alanı her zaman doldurulur — geçersiz JSON bile saklanır.
 * Bu sayede hangi cihazın ne gönderdiği, hata sonrası denetlenebilir.
 */
@Entity
@Table(name = "error_logs",
       indexes = {
           @Index(name = "idx_error_logs_camera_id",  columnList = "camera_id"),
           @Index(name = "idx_error_logs_error_type", columnList = "error_type"),
           @Index(name = "idx_error_logs_created_at", columnList = "created_at")
       })
@Getter
@Setter
@NoArgsConstructor
public class ErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Geçersiz istekte alan eksik olabilir — nullable
    @Column(name = "camera_id")
    private String cameraId;

    @Column(name = "bus_id")
    private Long busId;

    // Ham JSON payload — hiçbir zaman null olmaz; geçersiz JSON bile string olarak saklanır
    @Column(name = "raw_payload", columnDefinition = "TEXT", nullable = false)
    private String rawPayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "error_type", nullable = false)
    private ErrorType errorType;

    // Hangi alanın neden reddedildiğine dair insan-okunabilir açıklama
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // İsteğin geldiği HTTP endpoint
    @Column(name = "endpoint")
    private String endpoint;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ErrorType {
        /** Zorunlu alan eksik (cameraId null, busId null vb.) */
        MISSING_FIELD,
        /** Alan mevcut ama değeri geçersiz (enum dışı değer, format hatası vb.) */
        VALIDATION_ERROR,
        /** HTTP body parse edilemedi (bozuk JSON, yanlış Content-Type) */
        MALFORMED_JSON
    }

    /** Factory — controller ve exception handler her ikisinden de kullanılabilir */
    public static ErrorLog of(String cameraId,
                               Long busId,
                               String rawPayload,
                               ErrorType errorType,
                               String errorMessage,
                               String endpoint) {
        ErrorLog log = new ErrorLog();
        log.cameraId = cameraId;
        log.busId = busId;
        log.rawPayload = rawPayload != null ? rawPayload : "(bos)";
        log.errorType = errorType;
        log.errorMessage = errorMessage;
        log.endpoint = endpoint;
        return log;
    }
}
