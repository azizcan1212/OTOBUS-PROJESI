package com.bus.occupancy.system.infrastructure.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;

/**
 * HTTP request body'sini önbelleğe alır.
 *
 * Spring'de bir request body bir kez okunduğunda tüketilir.
 * Hatalı JSON geldiğinde GlobalExceptionHandler rawPayload'a erişmek ister;
 * ancak Jackson body'yi çoktan tüketmiştir.
 *
 * ContentCachingRequestWrapper body'yi sarar ve birden fazla okumaya izin verir.
 * Yalnızca /api/v1/device/** endpoint'lerinde aktif — diğer yollarda gereksiz overhead yaratmamak için.
 *
 * Order=0: CorrelationIdFilter (Order=1) ve RequestLoggingFilter (Order=2) öncesinde çalışır.
 */
@Component
@Order(0)
public class RequestBodyCachingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(new ContentCachingRequestWrapper(request), response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Sadece device endpoint'lerinde body cache'lenir
        return !request.getRequestURI().startsWith("/api/v1/device");
    }
}
