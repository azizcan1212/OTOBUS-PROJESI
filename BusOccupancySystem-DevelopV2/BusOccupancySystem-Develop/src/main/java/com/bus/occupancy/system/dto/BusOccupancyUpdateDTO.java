package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.BusStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Frontend busRealtimeClient.ts'in bekledigine gore iki tip WebSocket mesaji vardir:
 *   - type="fleet-snapshot": Tum filosun tam listesi
 *   - type="bus-update":     Bir ya da daha fazla otobusun delta guncellemesi
 *
 * Backend her occupancy degisikliginde "bus-update" tipi mesaj gonderir.
 */
public record BusOccupancyUpdateDTO(
        String type,
        List<BusSummaryDto> buses,
        List<Long> removedBusIds
) {
    public static BusOccupancyUpdateDTO busUpdate(BusSummaryDto updatedBus) {
        return new BusOccupancyUpdateDTO("bus-update", List.of(updatedBus), List.of());
    }

    public static BusOccupancyUpdateDTO fleetSnapshot(List<BusSummaryDto> allBuses) {
        return new BusOccupancyUpdateDTO("fleet-snapshot", allBuses, List.of());
    }
}
