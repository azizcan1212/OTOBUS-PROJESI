package com.bus.occupancy.system.config.security;

import com.bus.occupancy.system.dto.ErrorResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * JWT eksik veya gecersiz oldugunda 401, yetki yetersizliginde 403 dondurur.
 * Spring Security varsayilan davranisi HTML dondurmektedir — bu sinif JSON formatinda
 * tutarli hata yaniti saglar.
 */
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setContentType("application/json;charset=UTF-8");

        String authHeader = request.getHeader("Authorization");
        boolean tokenPresent = authHeader != null && authHeader.startsWith("Bearer ");

        if (tokenPresent) {
            // Token var ama gecersiz ya da suresi dolmus
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeError(response, ErrorResponseDTO.ErrorCodeEnum.TOKEN_INVALID,
                    "Token gecersiz veya suresi dolmus.");
        } else {
            // Hic token yok — kimlik dogrulamasi yapilmamis istek
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeError(response, ErrorResponseDTO.ErrorCodeEnum.TOKEN_INVALID,
                    "Bu kaynaga erisim icin kimlik dogrulamasi gereklidir.");
        }
    }

    private void writeError(HttpServletResponse response,
                            ErrorResponseDTO.ErrorCodeEnum code,
                            String message) throws IOException {
        ErrorResponseDTO error = new ErrorResponseDTO(
                new ErrorResponseDTO.ErrorCode(code, message),
                LocalDateTime.now()
        );
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
