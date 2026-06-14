package com.bus.occupancy.system.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter,
                                  UserDetailsService userDetailsService,
                                  AuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        final String[] SWAGGER_PATHS = {
                "/swagger-ui/index.html",
                "/v3/api-docs/**",
                "/swagger-ui/**"
        };

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Yeni ADMIN kullanici olusturma yalnizca mevcut adminlere acik
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").hasRole("ADMIN")
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(SWAGGER_PATHS).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/buses").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/buses/**").permitAll()
                        // Frontend env.ts'deki ws://localhost:8080/ws/buses ile eslesiyor
                        .requestMatchers("/ws/buses/**").permitAll()
                        // Statistics ve admin paneli yalnizca ADMIN rolune acik
                        .requestMatchers(HttpMethod.GET, "/api/v1/statistics").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/buses").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/buses/*/assignment").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/buses/*/occupancy").hasAnyRole("ADMIN", "DEVICE")
                        // Cihaz/AI veri girisi - JWT token (ADMIN veya DEVICE rolu) zorunlu
                        .requestMatchers(HttpMethod.POST, "/api/v1/device/input").hasAnyRole("ADMIN", "DEVICE")
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:8081",
                "https://busproject.marceverse.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Wildcard (*) + allowCredentials(true) kombinasyonu CORS spec ihlalidir — acik liste zorunlu
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Correlation-Id"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
