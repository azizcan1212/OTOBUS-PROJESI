package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.dto.AuthRequest;
import com.bus.occupancy.system.dto.AuthResponse;
import com.bus.occupancy.system.dto.ErrorResponseDTO;
import com.bus.occupancy.system.dto.UserRequest;
import com.bus.occupancy.system.dto.UserResponse;
import com.bus.occupancy.system.service.AuthService;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Kimlik dogrulama islemleri")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Giris yap", description = "Kullanici adi ve sifre ile JWT token alinir.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Basariyla giris yapildi."),
            @ApiResponse(responseCode = "401", description = "Sifre yanlis."),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi."),
            @ApiResponse(responseCode = "429", description = "Cok fazla istek — lutfen bekle.")
    })
    @PostMapping("/login")
    @RateLimiter(name = "loginRateLimiter", fallbackMethod = "loginRateLimitFallback")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Cikis yap", description = "Istemci tarafinda token silinmeli.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cikis islemi basarili.")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        return ResponseEntity.ok("Cikis islemi basarili.");
    }

    @Operation(summary = "Kullanici kaydet",
               description = "Yeni ADMIN kullanici olusturur. Sadece mevcut ADMIN kullanicilar cagirabilir.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Kullanici basariyla olusturuldu."),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulamasi gerekli."),
            @ApiResponse(responseCode = "403", description = "Yetkisiz erisim."),
            @ApiResponse(responseCode = "409", description = "Bu kullanici adi zaten kayitli.")
    })
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody UserRequest requestDTO) {
        UserResponse responseDTO = authService.add(requestDTO);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDTO.id())
                .toUri();
        return ResponseEntity.created(location).build();
    }

    // --- Rate Limit Fallback ---

    public ResponseEntity<ErrorResponseDTO> loginRateLimitFallback(
            AuthRequest request, RequestNotPermitted ex) {
        ErrorResponseDTO error = new ErrorResponseDTO(
                new ErrorResponseDTO.ErrorCode(
                        ErrorResponseDTO.ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
                        "Cok fazla giris denemesi. Lutfen 10 saniye sonra tekrar deneyin."),
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }
}
