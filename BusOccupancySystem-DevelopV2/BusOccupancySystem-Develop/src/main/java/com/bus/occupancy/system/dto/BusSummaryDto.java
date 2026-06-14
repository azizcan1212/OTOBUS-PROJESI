package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.BusStatus;

import java.time.LocalDateTime;

/**
 * Frontend BusCard ve Dashboard icin tam BusRecord semasiyla eslesen ozet DTO.
 * Alan isimleri frontend types/bus.ts BusRecord tipiyle birebir eslesiyor.
 */
public record BusSummaryDto(
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
        LocalDateTime lastUpdatedAt
) {}
