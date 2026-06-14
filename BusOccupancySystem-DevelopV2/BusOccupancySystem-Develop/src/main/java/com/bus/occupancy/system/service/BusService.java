package com.bus.occupancy.system.service;

import com.bus.occupancy.system.config.websocket.BusWebSocketHandler;
import com.bus.occupancy.system.dto.*;
import com.bus.occupancy.system.mapper.BusMapper;
import com.bus.occupancy.system.model.Bus;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.model.OccupancyLog;
import com.bus.occupancy.system.repository.BusRepository;
import com.bus.occupancy.system.repository.OccupancyLogRepository;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BusService {

    private final BusRepository busRepository;
    private final OccupancyLogRepository occupancyLogRepository;
    private final BusWebSocketHandler webSocketHandler;
    private final BusMapper busMapper;

    public BusService(BusRepository busRepository,
                      OccupancyLogRepository occupancyLogRepository,
                      BusWebSocketHandler webSocketHandler,
                      BusMapper busMapper) {
        this.busRepository = busRepository;
        this.occupancyLogRepository = occupancyLogRepository;
        this.webSocketHandler = webSocketHandler;
        this.busMapper = busMapper;
    }

    /**
     * Tum otobüsleri sayfalayarak donderir.
     * Sayfalama kullanilmazsa sinirsiz veri donebilir — bu sebeple Pageable zorunludur.
     * Ornek: GET /api/v1/buses?page=0&size=20&sort=lineCode,asc
     */
    @Transactional(readOnly = true)
    public Page<BusSummaryDto> getAllBuses(Pageable pageable) {
        return busRepository.findAll(pageable)
                .map(busMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public BusDetailResponse getBusById(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Otobus bulunamadi, id: " + id));
        List<OccupancyLogResponseDTO> occupancyList = occupancyLogRepository.findAllByBusId(id);
        return busMapper.toDetailResponse(bus, occupancyList);
    }

    @Transactional
    public Bus createBus(BusRequest request) {
        if (busRepository.existsByPlateNumber(request.plateNumber())) {
            throw new EntityExistsException(
                    "Bu plakaya sahip otobus zaten kayitli: " + request.plateNumber());
        }
        Bus bus = new Bus();
        bus.setBusOccupancy(0);
        bus.setMaxCapacity(request.maxCapacity() != null ? request.maxCapacity() : 50);
        bus.setLineCode(request.lineCode());
        bus.setRouteName(request.routeName());
        bus.setPlateNumber(request.plateNumber());
        bus.setFleetCode(request.fleetCode());
        bus.setCurrentStop(request.currentStop());
        bus.setDestination(request.destination());
        bus.setDriverName(request.driverName());
        bus.setStatus(request.status() != null ? request.status() : BusStatus.ON_TIME);
        return busRepository.save(bus);
    }

    @Transactional
    public BusSummaryDto updateOccupancy(Long id, int newOccupancy) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Otobus bulunamadi, id: " + id));

        // Her cihaz okumasi farkli bir zamani temsil eder — deger degismese de gecmise kaydedilir
        OccupancyLog log = new OccupancyLog();
        log.setBus(bus);
        log.setOccupancy(newOccupancy);
        occupancyLogRepository.save(log);

        if (bus.getBusOccupancy() != newOccupancy) {
            bus.setBusOccupancy(newOccupancy);
            bus = busRepository.save(bus);

            webSocketHandler.broadcast(BusOccupancyUpdateDTO.busUpdate(busMapper.toSummaryDto(bus)));
        }

        return busMapper.toSummaryDto(bus);
    }

    // Cihaz verisinden eslenen otobus durumunu gunceller (RUNNING/STOPPED/MAINTENANCE -> BusStatus)
    @Transactional
    public BusSummaryDto updateStatus(Long id, BusStatus newStatus) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Otobus bulunamadi, id: " + id));

        if (bus.getStatus() != newStatus) {
            bus.setStatus(newStatus);
            bus = busRepository.save(bus);

            webSocketHandler.broadcast(BusOccupancyUpdateDTO.busUpdate(busMapper.toSummaryDto(bus)));
        }

        return busMapper.toSummaryDto(bus);
    }

    // Admin panelinden sofor adi / plaka atamasi - alanlar opsiyonel, sadece gonderilenler guncellenir
    @Transactional
    public BusSummaryDto updateAssignment(Long id, BusAssignmentDTO request) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Otobus bulunamadi, id: " + id));

        if (request.plateNumber() != null) {
            if (busRepository.existsByPlateNumberAndIdNot(request.plateNumber(), id)) {
                throw new EntityExistsException(
                        "Bu plakaya sahip baska bir otobus zaten kayitli: " + request.plateNumber());
            }
            bus.setPlateNumber(request.plateNumber());
        }

        if (request.driverName() != null) {
            bus.setDriverName(request.driverName());
        }

        bus = busRepository.save(bus);
        webSocketHandler.broadcast(BusOccupancyUpdateDTO.busUpdate(busMapper.toSummaryDto(bus)));
        return busMapper.toSummaryDto(bus);
    }
}
