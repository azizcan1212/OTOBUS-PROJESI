package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.dto.StatisticsResponse;
import com.bus.occupancy.system.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Frontend StatisticsPage -> statisticsService.ts -> GET /statistics ile eslesiyor.
 * Yetkili kullanici (ADMIN) gerektirir.
 */
@RestController
@RequestMapping("${api.root}/statistics")
@Tag(name = "Statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @Operation(summary = "Filo istatistiklerini getir",
               description = "Gunluk/saatlik doluluk ortalamalari, durum dagilimi ve trend analizini donderir.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Istatistikler basariyla donduruldu."),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulamasi gerekli."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz erisim.")
    })
    @GetMapping
    public ResponseEntity<StatisticsResponse> getStatistics(
            @RequestParam(required = false, defaultValue = "DAY") String period,
            @RequestParam(required = false) Integer hourFrom,
            @RequestParam(required = false) Integer hourTo,
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) String fleetCode
    ) {
        return ResponseEntity.ok(
                statisticsService.calculate(period, hourFrom, hourTo, plateNumber, fleetCode)
        );
    }
}
