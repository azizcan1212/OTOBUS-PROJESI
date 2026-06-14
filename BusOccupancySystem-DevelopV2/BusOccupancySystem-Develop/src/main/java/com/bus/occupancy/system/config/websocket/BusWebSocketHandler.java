package com.bus.occupancy.system.config.websocket;

import com.bus.occupancy.system.dto.BusOccupancyUpdateDTO;
import com.bus.occupancy.system.service.BusService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Saf WebSocket handler — frontend busRealtimeClient.ts ile eslesiyor.
 *
 * Baglanti kurulunca fleet-snapshot gonderir (Bus-Project ile ayni davranis).
 * Doluluk degisikliginde bus-update yayinlar.
 */
@Component
public class BusWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(BusWebSocketHandler.class);

    // ConcurrentHashMap — thread-safe, ayni anda birden fazla baglanti guvenli sekilde yonetilebilir
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    private final BusService busService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public BusWebSocketHandler(@Lazy BusService busService) {
        this.busService = busService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        log.info("WebSocket baglantisi kuruldu: {} (toplam: {})", session.getId(), sessions.size());
        try {
            var allBuses = busService.getAllBuses(Pageable.unpaged()).getContent();
            var snapshot = BusOccupancyUpdateDTO.fleetSnapshot(allBuses);
            sendToSession(session, snapshot);
            log.info("Fleet snapshot gonderildi: {} otobus -> {}", allBuses.size(), session.getId());
        } catch (Exception e) {
            log.warn("Fleet snapshot gonderilemedi: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        log.info("WebSocket baglantisi kapandi: {} - {} (toplam: {})", session.getId(), status, sessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport hatasi: {} - {}", session.getId(), exception.getMessage());
        sessions.remove(session.getId());
        if (session.isOpen()) {
            try {
                session.close(CloseStatus.SERVER_ERROR);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Tum bagli istemcilere JSON mesaji yayinlar.
     */
    public void broadcast(Object payload) {
        if (sessions.isEmpty()) {
            return;
        }

        sessions.values().forEach(session -> sendToSession(session, payload));
    }

    private void sendToSession(WebSocketSession session, Object payload) {
        if (!session.isOpen()) {
            sessions.remove(session.getId());
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.warn("Mesaj gonderilemedi: {} - {}", session.getId(), e.getMessage());
            sessions.remove(session.getId());
        }
    }

    public int getActiveConnectionCount() {
        return sessions.size();
    }
}
