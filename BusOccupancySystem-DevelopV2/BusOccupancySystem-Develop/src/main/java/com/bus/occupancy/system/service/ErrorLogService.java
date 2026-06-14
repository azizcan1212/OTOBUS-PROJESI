package com.bus.occupancy.system.service;

import com.bus.occupancy.system.model.ErrorLog;
import com.bus.occupancy.system.repository.ErrorLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Başarısız cihaz isteklerini ErrorLog tablosuna yazar.
 *
 * PROPAGATION.REQUIRES_NEW: Ana transaction rollback olsa bile
 * hata kaydı yine de veritabanına yazılır.
 * Bu sayede geçersiz isteğin izi hiçbir zaman kaybolmaz.
 *
 * @Async("deviceTaskExecutor"): DB insert, cihaza donen HTTP yanitini
 * bloke etmesin diye ayri bir thread havuzunda calisir (fire-and-forget).
 * Controller 422/400 yanitini hemen doner, kayit arka planda tamamlanir.
 */
@Service
public class ErrorLogService {

    private static final Logger log = LoggerFactory.getLogger(ErrorLogService.class);

    private final ErrorLogRepository errorLogRepository;

    public ErrorLogService(ErrorLogRepository errorLogRepository) {
        this.errorLogRepository = errorLogRepository;
    }

    @Async("deviceTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(String cameraId,
                     Long busId,
                     String rawPayload,
                     ErrorLog.ErrorType errorType,
                     String errorMessage,
                     String endpoint) {

        ErrorLog errorLog = ErrorLog.of(cameraId, busId, rawPayload, errorType, errorMessage, endpoint);
        ErrorLog saved = errorLogRepository.save(errorLog);

        log.warn("Gecersiz cihaz istegi kaydedildi - id={}, endpoint={}, cameraId={}, busId={}, tur={}, mesaj=\"{}\"",
                saved.getId(), endpoint, cameraId, busId, errorType, errorMessage);
    }
}
