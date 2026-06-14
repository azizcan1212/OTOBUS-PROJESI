package com.bus.occupancy.system.service;

import com.bus.occupancy.system.config.websocket.BusWebSocketHandler;
import com.bus.occupancy.system.dto.BusDetailResponse;
import com.bus.occupancy.system.dto.BusRequest;
import com.bus.occupancy.system.dto.BusSummaryDto;
import com.bus.occupancy.system.mapper.BusMapper;
import com.bus.occupancy.system.model.Bus;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.repository.BusRepository;
import com.bus.occupancy.system.repository.OccupancyLogRepository;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BusService Unit Testleri")
class BusServiceTest {

    @Mock
    BusRepository busRepository;
    @Mock
    OccupancyLogRepository occupancyLogRepository;
    @Mock
    BusWebSocketHandler webSocketHandler;
    @Mock
    BusMapper busMapper;

    @InjectMocks
    BusService busService;

    private Bus testBus;
    private BusSummaryDto testSummary;

    @BeforeEach
    void setUp() {
        testBus = new Bus();
        testBus.setLineCode("34A");
        testBus.setRouteName("Kadikoy - Taksim");
        testBus.setPlateNumber("34 ABC 001");
        testBus.setMaxCapacity(50);
        testBus.setBusOccupancy(20);
        testBus.setStatus(BusStatus.ON_TIME);

        testSummary = new BusSummaryDto(
                1L, "34A", "Kadikoy - Taksim", "34 ABC 001",
                null, null, null,
                20, 50, 40, null, null,
                BusStatus.ON_TIME, null
        );
    }

    // ===== getAllBuses() =====

    @Test
    @DisplayName("Tum otobusler sayfalayarak dondurulur")
    void getAllBuses_basarili() {
        Page<Bus> busPage = new PageImpl<>(List.of(testBus));
        PageRequest pageable = PageRequest.of(0, 20);

        given(busRepository.findAll(pageable)).willReturn(busPage);
        given(busMapper.toSummaryDto(testBus)).willReturn(testSummary);

        Page<BusSummaryDto> result = busService.getAllBuses(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).lineCode()).isEqualTo("34A");
    }

    // ===== getBusById() =====

    @Test
    @DisplayName("Var olan ID ile otobus detayi dondurulur")
    void getBusById_basarili() {
        given(busRepository.findById(1L)).willReturn(Optional.of(testBus));
        given(occupancyLogRepository.findAllByBusId(1L)).willReturn(List.of());
        given(busMapper.toDetailResponse(eq(testBus), anyList())).willReturn(
                new BusDetailResponse(1L, "34A", "Kadikoy - Taksim",
                        "34 ABC 001", null, null, null,
                        20, 50, 40, null, null,
                        BusStatus.ON_TIME, null, List.of())
        );

        BusDetailResponse result = busService.getBusById(1L);

        assertThat(result.lineCode()).isEqualTo("34A");
        assertThat(result.activePassengerCount()).isEqualTo(20);
    }

    @Test
    @DisplayName("Var olmayan ID ile EntityNotFoundException firlatir")
    void getBusById_bulunamadi() {
        given(busRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> busService.getBusById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ===== createBus() =====

    @Test
    @DisplayName("Yeni plaka ile otobus olusturulur")
    void createBus_basarili() {
        BusRequest request = new BusRequest(
                "34B", "Uskudar - Besiktas", "34 NEW 099",
                null, null, null, null, null, null
        );

        given(busRepository.existsByPlateNumber("34 NEW 099")).willReturn(false);
        given(busRepository.save(any(Bus.class))).willReturn(testBus);

        Bus result = busService.createBus(request);

        assertThat(result).isNotNull();
        then(busRepository).should().save(any(Bus.class));
    }

    @Test
    @DisplayName("Ayni plaka ile otobus olusturmak EntityExistsException firlatir")
    void createBus_plaka_mevcut() {
        BusRequest request = new BusRequest(
                "34A", "Kadikoy - Taksim", "34 ABC 001",
                null, null, null, null, null, null
        );

        given(busRepository.existsByPlateNumber("34 ABC 001")).willReturn(true);

        assertThatThrownBy(() -> busService.createBus(request))
                .isInstanceOf(EntityExistsException.class)
                .hasMessageContaining("34 ABC 001");

        then(busRepository).should(never()).save(any());
    }

    // ===== updateOccupancy() =====

    @Test
    @DisplayName("Doluluk degeri degistiginde log kaydedilir ve WebSocket mesaji gonderilir")
    void updateOccupancy_deger_degisti() {
        given(busRepository.findById(1L)).willReturn(Optional.of(testBus));
        given(busRepository.save(any(Bus.class))).willReturn(testBus);
        given(busMapper.toSummaryDto(any(Bus.class))).willReturn(testSummary);

        busService.updateOccupancy(1L, 35); // 20 → 35

        then(occupancyLogRepository).should().save(any());
        then(webSocketHandler).should().broadcast(any());
    }

    @Test
    @DisplayName("Doluluk degeri ayni kalirsa log ve WebSocket mesaji gonderilmez")
    void updateOccupancy_deger_degismedi() {
        given(busRepository.findById(1L)).willReturn(Optional.of(testBus));
        given(busMapper.toSummaryDto(testBus)).willReturn(testSummary);

        busService.updateOccupancy(1L, 20); // 20 → 20 (ayni)

        then(occupancyLogRepository).should(never()).save(any());
        then(webSocketHandler).should(never()).broadcast(any());
    }

    @Test
    @DisplayName("Var olmayan ID ile doluluk guncellemesi EntityNotFoundException firlatir")
    void updateOccupancy_otobus_bulunamadi() {
        given(busRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> busService.updateOccupancy(99L, 50))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }
}
