package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.BusStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Frontend BusDetailPage icin tam BusRecord semasiyla eslesen detay DTO.
 * occupancyList gecmis doluluk kayitlarini icerir (grafik gosterimi).
 */
public record BusDetailResponse(
        Long id,
        String lineCode,
        String routeName,
        String plateNumber,
        String fleetCode,
        String currentStop,
        String destination,
        int activePassengerCount,
        int maxCapacity,
        int occupancyRate,
        Integer delayInMinutes,
        String driverName,
        BusStatus status,
        LocalDateTime lastUpdatedAt,
        List<OccupancyLogResponseDTO> occupancyList
) {
}
