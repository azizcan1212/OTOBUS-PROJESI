package com.bus.occupancy.system.service;

import com.bus.occupancy.system.dto.DeviceInputDTO;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.model.DeviceBusStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Yalnızca tam doğrulamadan geçmiş cihaz verisi bu servise ulaşır.
 *
 * Sorumluluklar:
 *   1. Cihaz verisini iş nesnelerine (Bus doluluk, durum) dönüştürmek
 *   2. BusService.updateOccupancy çağrısını tetiklemek
 *   3. Gerekirse ek domain olayları yayınlamak
 *
 * Kural: Bu servis hiçbir doğrulama yapmaz —
 * veriyi güvenilir kabul eder çünkü pipeline garantisi var.
 *
 * @Async("deviceTaskExecutor"): DB guncelleme + WebSocket yayini,
 * cihaza donen 204 yanitini bloke etmeden arka planda yapilir.
 */
@Service
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    private final BusService busService;

    public VerificationService(BusService busService) {
        this.busService = busService;
    }

    @Async("deviceTaskExecutor")
    public void process(DeviceInputDTO dto) {
        log.info("Dogrulanmis cihaz verisi isleniyor (async, thread={}) — cameraId={} busId={} passengerCount={}",
                Thread.currentThread().getName(), dto.cameraId(), dto.busId(), dto.passengerCount());

        // Yolcu sayısı varsa otobüs doluluk güncellemesi tetiklenir
        if (dto.passengerCount() != null) {
            busService.updateOccupancy(dto.busId(), dto.passengerCount());
        }

        // Cihaz otobüs durumu → frontend gösterim durumuna dönüştürülüp kaydedilir
        BusStatus mappedStatus = mapDeviceStatusToBusStatus(dto.busStatus());
        log.debug("Cihaz durumu eslestirildi — DeviceBusStatus={} -> BusStatus={}",
                dto.busStatus(), mappedStatus);
        busService.updateStatus(dto.busId(), mappedStatus);
    }

    private BusStatus mapDeviceStatusToBusStatus(DeviceBusStatus deviceStatus) {
        return switch (deviceStatus) {
            case RUNNING     -> BusStatus.ON_TIME;
            case STOPPED     -> BusStatus.DELAYED;
            case MAINTENANCE -> BusStatus.OUT_OF_SERVICE;
        };
    }
}
