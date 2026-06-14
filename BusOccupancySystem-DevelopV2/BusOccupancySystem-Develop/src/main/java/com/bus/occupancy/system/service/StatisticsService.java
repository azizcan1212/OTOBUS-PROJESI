package com.bus.occupancy.system.service;

import com.bus.occupancy.system.dto.StatisticsResponse;
import com.bus.occupancy.system.model.Bus;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.model.OccupancyLog;
import com.bus.occupancy.system.repository.BusRepository;
import com.bus.occupancy.system.repository.OccupancyLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private static final String ZONE_ID = "Europe/Istanbul";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd MMM", Locale.ENGLISH);

    private final OccupancyLogRepository occupancyLogRepository;
    private final BusRepository busRepository;

    public StatisticsService(OccupancyLogRepository occupancyLogRepository,
                             BusRepository busRepository) {
        this.occupancyLogRepository = occupancyLogRepository;
        this.busRepository = busRepository;
    }

    @Transactional(readOnly = true)
    public StatisticsResponse calculate(String period,
                                        Integer hourFrom,
                                        Integer hourTo,
                                        String plateNumber,
                                        String fleetCode) {

        ZoneId zone = ZoneId.of(ZONE_ID);
        ZonedDateTime now = ZonedDateTime.now(zone);
        ZonedDateTime startAt = resolveStart(period, now);
        LocalDateTime startLocal = startAt.toLocalDateTime();

        List<Bus> allBuses = busRepository.findAll();

        // Log tablosundan verileri al
        List<OccupancyLog> logs = new ArrayList<>(occupancyLogRepository.findAllSince(startLocal));

        // Plaka filtresi
        if (plateNumber != null && !plateNumber.isBlank()) {
            logs = logs.stream()
                    .filter(l -> l.getBus() != null
                            && plateNumber.equalsIgnoreCase(l.getBus().getPlateNumber()))
                    .collect(Collectors.toList());
        }

        // Fleet code filtresi
        if (fleetCode != null && !fleetCode.isBlank()) {
            logs = logs.stream()
                    .filter(l -> l.getBus() != null
                            && fleetCode.equalsIgnoreCase(l.getBus().getFleetCode()))
                    .collect(Collectors.toList());
        }

        // Saat araligi filtresi
        if (hourFrom != null) {
            logs = logs.stream()
                    .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().getHour() >= hourFrom)
                    .collect(Collectors.toList());
        }
        if (hourTo != null) {
            logs = logs.stream()
                    .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().getHour() < hourTo)
                    .collect(Collectors.toList());
        }

        // Log yoksa mevcut otobüslerin anlık değerlerinden istatistik üret
        boolean usingLiveData = logs.isEmpty();
        double avgOccupancy;
        double avgPassenger;
        int sampleCount;

        if (usingLiveData) {
            // Anlık otobüs verilerinden hesapla
            List<Bus> filtered = filterBusesByParams(allBuses, plateNumber, fleetCode);
            avgOccupancy = filtered.stream()
                    .mapToInt(Bus::getOccupancyRate)
                    .average().orElse(0);
            avgPassenger = filtered.stream()
                    .mapToInt(Bus::getBusOccupancy)
                    .average().orElse(0);
            sampleCount = filtered.size();
        } else {
            avgOccupancy = logs.stream().mapToInt(OccupancyLog::getOccupancy).average().orElse(0);
            avgPassenger = logs.stream().mapToInt(OccupancyLog::getOccupancy).average().orElse(0);
            sampleCount = logs.size();
        }

        List<StatisticsResponse.HourlyBreakpointDto> hourlyBreakdown =
                usingLiveData ? buildLiveHourlyBreakdown(allBuses, now)
                              : buildHourlyBreakdown(logs);

        List<StatisticsResponse.DailyBreakpointDto> dailyBreakdown =
                usingLiveData ? buildLiveDailyBreakdown(allBuses, now)
                              : buildDailyBreakdown(logs);

        List<StatisticsResponse.StatusDistributionDto> statusDistribution = buildStatusDistribution();

        return new StatisticsResponse(
                period != null ? period : "DAY",
                ZONE_ID,
                startAt.format(ISO_FORMATTER),
                now.format(ISO_FORMATTER),
                now.format(ISO_FORMATTER),
                hourFrom,
                hourTo,
                plateNumber != null && !plateNumber.isBlank() ? plateNumber : null,
                fleetCode != null && !fleetCode.isBlank() ? fleetCode : null,
                sampleCount,
                allBuses.size(),
                true,
                Math.round(avgOccupancy * 10.0) / 10.0,
                Math.round(avgPassenger * 10.0) / 10.0,
                hourlyBreakdown,
                dailyBreakdown,
                statusDistribution
        );
    }

    // Mevcut otobüs değerlerinden tek bir saatlik nokta üret (şu anki saat)
    private List<StatisticsResponse.HourlyBreakpointDto> buildLiveHourlyBreakdown(
            List<Bus> buses, ZonedDateTime now) {
        int currentHour = now.getHour();
        double avgOcc = buses.stream().mapToInt(Bus::getOccupancyRate).average().orElse(0);
        double avgPass = buses.stream().mapToInt(Bus::getBusOccupancy).average().orElse(0);
        return List.of(new StatisticsResponse.HourlyBreakpointDto(
                currentHour,
                Math.round(avgOcc * 10.0) / 10.0,
                Math.round(avgPass * 10.0) / 10.0,
                buses.size()
        ));
    }

    // Mevcut otobüs değerlerinden bugün için tek bir günlük nokta üret
    private List<StatisticsResponse.DailyBreakpointDto> buildLiveDailyBreakdown(
            List<Bus> buses, ZonedDateTime now) {
        LocalDate today = now.toLocalDate();
        double avgOcc = buses.stream().mapToInt(Bus::getOccupancyRate).average().orElse(0);
        double avgPass = buses.stream().mapToInt(Bus::getBusOccupancy).average().orElse(0);
        int peak = buses.stream().mapToInt(Bus::getBusOccupancy).max().orElse(0);
        return List.of(new StatisticsResponse.DailyBreakpointDto(
                today.toString(),
                today.format(DAY_LABEL),
                Math.round(avgOcc * 10.0) / 10.0,
                Math.round(avgPass * 10.0) / 10.0,
                peak,
                buses.size()
        ));
    }

    private List<Bus> filterBusesByParams(List<Bus> buses, String plateNumber, String fleetCode) {
        return buses.stream()
                .filter(b -> plateNumber == null || plateNumber.isBlank()
                        || plateNumber.equalsIgnoreCase(b.getPlateNumber()))
                .filter(b -> fleetCode == null || fleetCode.isBlank()
                        || fleetCode.equalsIgnoreCase(b.getFleetCode()))
                .collect(Collectors.toList());
    }

    private ZonedDateTime resolveStart(String period, ZonedDateTime now) {
        if (period == null) return now.minusDays(1);
        return switch (period.toUpperCase()) {
            case "DAY"       -> now.minusDays(1);
            case "WEEK"      -> now.minusWeeks(1);
            case "MONTH"     -> now.minusMonths(1);
            case "3MONTHS"   -> now.minusMonths(3);
            case "6MONTHS"   -> now.minusMonths(6);
            case "12MONTHS"  -> now.minusMonths(12);
            default          -> now.minusDays(1);
        };
    }

    private List<StatisticsResponse.HourlyBreakpointDto> buildHourlyBreakdown(List<OccupancyLog> logs) {
        Map<Integer, List<OccupancyLog>> byHour = logs.stream()
                .filter(l -> l.getCreatedAt() != null)
                .collect(Collectors.groupingBy(l -> l.getCreatedAt().getHour()));

        return byHour.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<OccupancyLog> hourLogs = entry.getValue();
                    double avgOcc = hourLogs.stream().mapToInt(OccupancyLog::getOccupancy).average().orElse(0);
                    double avgPass = avgOcc;
                    return new StatisticsResponse.HourlyBreakpointDto(
                            entry.getKey(),
                            Math.round(avgOcc * 10.0) / 10.0,
                            Math.round(avgPass * 10.0) / 10.0,
                            hourLogs.size()
                    );
                })
                .collect(Collectors.toList());
    }

    private List<StatisticsResponse.DailyBreakpointDto> buildDailyBreakdown(List<OccupancyLog> logs) {
        Map<LocalDate, List<OccupancyLog>> byDay = logs.stream()
                .filter(l -> l.getCreatedAt() != null)
                .collect(Collectors.groupingBy(l -> l.getCreatedAt().toLocalDate()));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<OccupancyLog> dayLogs = entry.getValue();
                    double avgOcc = dayLogs.stream().mapToInt(OccupancyLog::getOccupancy).average().orElse(0);
                    int peak = dayLogs.stream().mapToInt(OccupancyLog::getOccupancy).max().orElse(0);
                    return new StatisticsResponse.DailyBreakpointDto(
                            entry.getKey().toString(),
                            entry.getKey().format(DAY_LABEL),
                            Math.round(avgOcc * 10.0) / 10.0,
                            Math.round(avgOcc * 10.0) / 10.0,
                            peak,
                            dayLogs.size()
                    );
                })
                .collect(Collectors.toList());
    }

    private List<StatisticsResponse.StatusDistributionDto> buildStatusDistribution() {
        Map<BusStatus, Long> counts = busRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        bus -> bus.getStatus() != null ? bus.getStatus() : BusStatus.ON_TIME,
                        Collectors.counting()
                ));

        long total = counts.values().stream().mapToLong(Long::longValue).sum();

        return Arrays.stream(BusStatus.values())
                .map(status -> {
                    int count = counts.getOrDefault(status, 0L).intValue();
                    double percentage = total > 0
                            ? Math.round((count * 100.0 / total) * 10.0) / 10.0
                            : 0.0;
                    return new StatisticsResponse.StatusDistributionDto(
                            status,
                            statusLabel(status),
                            count,
                            percentage
                    );
                })
                .collect(Collectors.toList());
    }

    private String statusLabel(BusStatus status) {
        return switch (status) {
            case ON_TIME        -> "Zamanında";
            case DELAYED        -> "Gecikmiş";
            case OUT_OF_SERVICE -> "Hizmet Dışı";
        };
    }
}
