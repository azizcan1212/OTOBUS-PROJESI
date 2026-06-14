package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.dto.BusAssignmentDTO;
import com.bus.occupancy.system.dto.BusDetailResponse;
import com.bus.occupancy.system.dto.BusRequest;
import com.bus.occupancy.system.dto.BusSummaryDto;
import com.bus.occupancy.system.dto.ErrorResponseDTO;
import com.bus.occupancy.system.model.Bus;
import com.bus.occupancy.system.service.BusService;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;

@Validated
@RestController
@RequestMapping("${api.root}/buses")
@Tag(name = "Bus", description = "Otobus filo yonetimi")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @Operation(
            summary = "Tum otobüsleri sayfalayarak getir",
            description = "Varsayilan: sayfa=0, boyut=20, siralama=id artan. " +
                          "Ornek: GET /api/v1/buses?page=0&size=10&sort=lineCode,asc"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Otobus listesi basariyla donduruldu.")
    })
    @GetMapping
    public ResponseEntity<Page<BusSummaryDto>> getAllBuses(
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(busService.getAllBuses(pageable));
    }

    @Operation(summary = "ID ile otobus getir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Otobus basariyla donduruldu."),
            @ApiResponse(responseCode = "404", description = "Otobus bulunamadi.")
    })
    @GetMapping("/{id}")
    public ResponseEntity<BusDetailResponse> getBusById(
            @Parameter(description = "Otobus ID'si") @PathVariable Long id) {
        return ResponseEntity.ok(busService.getBusById(id));
    }

    @Operation(summary = "Yeni otobus olustur")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Otobus basariyla olusturuldu."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz islem."),
            @ApiResponse(responseCode = "409", description = "Bu plakaya sahip otobus zaten kayitli.")
    })
    @PostMapping
    public ResponseEntity<Void> createBus(@Valid @RequestBody BusRequest busRequest) {
        Bus response = busService.createBus(busRequest);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    @Operation(summary = "Otobus dolulugunu guncelle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Doluluk basariyla guncellendi."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz islem."),
            @ApiResponse(responseCode = "404", description = "Otobus bulunamadi.")
    })
    @PostMapping("/{id}/occupancy")
    @RateLimiter(name = "occupancyRateLimiter", fallbackMethod = "occupancyRateLimitFallback")
    public ResponseEntity<BusSummaryDto> updateOccupancy(
            @Parameter(description = "Otobus ID'si") @PathVariable Long id,
            @Parameter(description = "Yeni doluluk degeri (0-100)")
            @Min(value = 0,   message = "Doluluk degeri 0'dan kucuk olamaz")
            @Max(value = 100, message = "Doluluk degeri 100'den buyuk olamaz")
            @RequestParam int occupancy) {

        return ResponseEntity.ok(busService.updateOccupancy(id, occupancy));
    }

    @Operation(summary = "Otobus sofor adi / plaka atamasini guncelle (admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Atama basariyla guncellendi."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz islem."),
            @ApiResponse(responseCode = "404", description = "Otobus bulunamadi."),
            @ApiResponse(responseCode = "409", description = "Bu plakaya sahip baska bir otobus zaten kayitli.")
    })
    @PatchMapping("/{id}/assignment")
    public ResponseEntity<BusSummaryDto> updateAssignment(
            @Parameter(description = "Otobus ID'si") @PathVariable Long id,
            @Valid @RequestBody BusAssignmentDTO request) {
        return ResponseEntity.ok(busService.updateAssignment(id, request));
    }

    // --- Rate Limit Fallback ---

    public ResponseEntity<ErrorResponseDTO> occupancyRateLimitFallback(
            Long id, int occupancy, RequestNotPermitted ex) {
        ErrorResponseDTO error = new ErrorResponseDTO(
                new ErrorResponseDTO.ErrorCode(
                        ErrorResponseDTO.ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
                        "Cok fazla doluluk guncellemesi. Saniyede maksimum 10 istek izin verilir."),
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }
}
