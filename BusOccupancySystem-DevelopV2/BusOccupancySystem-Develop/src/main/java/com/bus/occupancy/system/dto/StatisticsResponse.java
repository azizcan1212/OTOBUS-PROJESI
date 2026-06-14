package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.BusStatus;

import java.util.List;

/**
 * Frontend StatisticsPage'in bekledigine tam uyan istatistik yanit nesnesi.
 * Alan isimleri types/statistics.ts BusStatisticsRecord tipiyle birebir eslesiyor.
 */
public record StatisticsResponse(
        String period,
        String zoneId,
        String startAt,
        String endAt,
        String generatedAt,
        Integer hourFrom,
        Integer hourTo,
        String plateNumber,
        String fleetCode,
        int sampleCount,
        int liveBusCount,
        boolean liveDataIncluded,
        double averageOccupancyRate,
        double averagePassengerCount,
        List<HourlyBreakpointDto> hourlyBreakdown,
        List<DailyBreakpointDto> dailyBreakdown,
        List<StatusDistributionDto> statusDistribution
) {
    public record HourlyBreakpointDto(
            int hour,
            double averageOccupancyRate,
            double averagePassengerCount,
            int sampleCount
    ) {}

    public record DailyBreakpointDto(
            String date,
            String label,
            double averageOccupancyRate,
            double averagePassengerCount,
            int peakPassengerCount,
            int sampleCount
    ) {}

    public record StatusDistributionDto(
            BusStatus status,
            String label,
            int count,
            double percentage
    ) {}
}
