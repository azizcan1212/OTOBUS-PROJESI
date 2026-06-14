package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.dto.ErrorLogResponseDTO;
import com.bus.occupancy.system.repository.ErrorLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

// Admin paneli - hata loglarini goruntuleme. Tum endpoint'ler ADMIN rolu gerektirir (SecurityConfiguration).
@RestController
@RequestMapping("${api.root}/admin")
@Tag(name = "Admin", description = "Yonetici paneli - hata loglari")
public class AdminController {

    private final ErrorLogRepository errorLogRepository;

    public AdminController(ErrorLogRepository errorLogRepository) {
        this.errorLogRepository = errorLogRepository;
    }

    @Operation(summary = "Hata loglarini sayfalayarak getir",
               description = "Cihaz/AI girisinde olusan dogrulama hatalarinin tam kaydi (en yeni once). " +
                       "from/to verilmezse tum kayitlar listelenir.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Hata loglari basariyla donduruldu."),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulamasi gerekli."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz erisim.")
    })
    @GetMapping("/error-logs")
    public ResponseEntity<Page<ErrorLogResponseDTO>> getErrorLogs(
            @ParameterObject
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable,
            @Parameter(description = "Bu tarih/saatten sonraki loglar (dahil). Ornek: 2024-06-01T00:00:00")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @Parameter(description = "Bu tarih/saatten onceki loglar (dahil). Ornek: 2024-06-02T23:59:59")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to) {

        LocalDateTime start = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = to != null ? to : LocalDateTime.now();

        return ResponseEntity.ok(errorLogRepository.findByCreatedAtBetween(start, end, pageable)
                .map(ErrorLogResponseDTO::from));
    }
}
