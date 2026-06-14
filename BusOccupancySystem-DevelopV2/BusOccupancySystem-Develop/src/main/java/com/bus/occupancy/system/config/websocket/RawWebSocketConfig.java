package com.bus.occupancy.system.config.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Frontend busRealtimeClient.ts'in baglandigi saf WebSocket endpoint'ini kaydeder.
 * Endpoint: ws://localhost:8080/ws/buses
 */
@Configuration
@EnableWebSocket
public class RawWebSocketConfig implements WebSocketConfigurer {

    private final BusWebSocketHandler busWebSocketHandler;

    public RawWebSocketConfig(BusWebSocketHandler busWebSocketHandler) {
        this.busWebSocketHandler = busWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(busWebSocketHandler, "/ws/buses")
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://localhost:8081",
                        "https://busproject.marceverse.com"
                );
    }
}
