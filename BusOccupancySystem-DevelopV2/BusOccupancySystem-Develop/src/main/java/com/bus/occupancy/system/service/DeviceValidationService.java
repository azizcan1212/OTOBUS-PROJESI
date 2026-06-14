package com.bus.occupancy.system.service;

import com.bus.occupancy.system.dto.DeviceInputDTO;
import com.bus.occupancy.system.exception.DeviceValidationException;
import com.bus.occupancy.system.model.CameraStatus;
import com.bus.occupancy.system.model.DeviceBusStatus;
import com.bus.occupancy.system.model.ErrorLog;
import com.bus.occupancy.system.repository.BusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Şema doğrulamasını (@Valid) geçen isteklere uygulanan iş kuralları.
 *
 * Kural hiyerarşisi:
 *   1. @Valid  → DTO şema doğrulaması (alan varlığı, format)
 *   2. Bu servis → iş mantığı doğrulaması (busId varlığı, zaman tutarlılığı vb.)
 *   3. VerificationService → çekirdek işlem
 */
@Service
public class DeviceValidationService {

    private static final Logger log = LoggerFactory.getLogger(DeviceValidationService.class);

    // Otobus, maksimum kapasitesinin en fazla %110'una kadar dolu olarak kabul edilir
    private static final double MAX_OVERCAPACITY_RATIO = 1.10;

    private final BusRepository busRepository;

    public DeviceValidationService(BusRepository busRepository) {
        this.busRepository = busRepository;
    }

    /**
     * İş katmanı doğrulamasını çalıştırır.
     * Herhangi bir kural ihlal edilirse {@link DeviceValidationException} fırlatır.
     *
     * @param dto  Şema doğrulamasından geçmiş, null-safe DTO
     */
    @Transactional(readOnly = true)
    public void validate(DeviceInputDTO dto) {
        List<String> violations = new ArrayList<>();

        checkBusExists(dto, violations);
        checkTimestampNotInFuture(dto, violations);
        checkCameraStatusConsistency(dto, violations);
        checkBusStatusAndPassengerCount(dto, violations);
        checkPassengerCountWithinCapacity(dto, violations);

        if (!violations.isEmpty()) {
            String message = String.join(" | ", violations);
            log.warn("Is kurali dogrulama hatasi - cameraId={}, busId={}, hatalar=[{}]",
                    dto.cameraId(), dto.busId(), message);
            throw new DeviceValidationException(message, ErrorLog.ErrorType.VALIDATION_ERROR);
        }
    }

    // busId veritabanında kayıtlı bir otobüse ait olmalı
    private void checkBusExists(DeviceInputDTO dto, List<String> v) {
        if (!busRepository.existsById(dto.busId())) {
            v.add("Gonderilen busId (" + dto.busId() + ") sistemde kayitli degil. " +
                  "Once bu ID'ye sahip bir otobus olusturulmali.");
        }
    }

    // timestamp gelecekte olmamalı (cihaz saat farkı toleransı ±5 dakika)
    private void checkTimestampNotInFuture(DeviceInputDTO dto, List<String> v) {
        try {
            OffsetDateTime ts = OffsetDateTime.parse(dto.timestamp());
            if (ts.isAfter(OffsetDateTime.now().plusMinutes(5))) {
                v.add("Gonderilen timestamp (" + dto.timestamp() + ") gelecekte bir tarihi gosteriyor. " +
                      "Cihazin saat ayari kontrol edilmeli.");
            }
            // Çok eski timestamp (24 saatten fazla) da şüpheli
            if (ts.isBefore(OffsetDateTime.now().minusHours(24))) {
                v.add("Gonderilen timestamp (" + dto.timestamp() + ") 24 saatten daha eski. " +
                      "Bu veri gecmise ait birikmis bir kayit olabilir.");
            }
        } catch (DateTimeParseException e) {
            // @Pattern zaten bu durumu yakalar; buradaki kontrol yedek güvencedir
            v.add("Gonderilen timestamp (" + dto.timestamp() + ") gecerli bir ISO-8601 tarih/saat formatinda degil.");
        }
    }

    // Kamera ERROR durumundaysa yolcu sayısı güvenilir değil — 0 veya null beklenir
    private void checkCameraStatusConsistency(DeviceInputDTO dto, List<String> v) {
        if (dto.cameraStatus() == CameraStatus.ERROR
                && dto.passengerCount() != null
                && dto.passengerCount() > 0) {
            v.add("Kamera durumu ERROR (arizali) olmasina ragmen passengerCount=" + dto.passengerCount() +
                  " degeri gonderildi. Arizali kameradan gelen yolcu sayisi guvenilir kabul edilemez.");
        }
    }

    // Otobüs MAINTENANCE durumundayken yolcu olmamalı
    private void checkBusStatusAndPassengerCount(DeviceInputDTO dto, List<String> v) {
        if (dto.busStatus() == DeviceBusStatus.MAINTENANCE
                && dto.passengerCount() != null
                && dto.passengerCount() > 0) {
            v.add("Otobus durumu MAINTENANCE (bakimda) olmasina ragmen passengerCount=" + dto.passengerCount() +
                  " degeri gonderildi. Bakimdaki bir otobuste yolcu bulunmamalidir.");
        }
    }

    // Yolcu sayisi otobusun maksimum kapasitesinin %110'unu asarsa veri sensor hatasi olarak kabul edilir
    private void checkPassengerCountWithinCapacity(DeviceInputDTO dto, List<String> v) {
        if (dto.passengerCount() == null) {
            return;
        }

        busRepository.findById(dto.busId()).ifPresent(bus -> {
            int capacityLimit = (int) Math.ceil(bus.getMaxCapacity() * MAX_OVERCAPACITY_RATIO);
            if (dto.passengerCount() > capacityLimit) {
                v.add("Gonderilen passengerCount (" + dto.passengerCount() + ") otobusun maksimum kapasitesinin " +
                      "(" + bus.getMaxCapacity() + ") %110'unu (" + capacityLimit + ") asiyor. " +
                      "Bu deger sensor hatasi olabilir.");
            }
        });
    }
}
