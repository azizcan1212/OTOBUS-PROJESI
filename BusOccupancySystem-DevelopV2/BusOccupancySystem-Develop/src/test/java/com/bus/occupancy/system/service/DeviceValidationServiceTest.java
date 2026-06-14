package com.bus.occupancy.system.service;

import com.bus.occupancy.system.dto.DeviceInputDTO;
import com.bus.occupancy.system.exception.DeviceValidationException;
import com.bus.occupancy.system.model.CameraStatus;
import com.bus.occupancy.system.model.DeviceBusStatus;
import com.bus.occupancy.system.repository.BusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeviceValidationService Unit Testleri")
class DeviceValidationServiceTest {

    @Mock BusRepository busRepository;
    @InjectMocks DeviceValidationService service;

    private static final Long BUS_ID = 1L;
    private static final String NOW_ISO = OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

    @BeforeEach
    void busExists() {
        given(busRepository.existsById(BUS_ID)).willReturn(true);
    }

    private DeviceInputDTO valid() {
        return new DeviceInputDTO(
                "CAM-001", BUS_ID, "Ahmet Yilmaz",
                CameraStatus.ACTIVE, DeviceBusStatus.RUNNING,
                NOW_ISO, 20
        );
    }

    @Test
    @DisplayName("Tum kurallar karsilaniyor — exception firlatilmaz")
    void validate_gecerli_istek() {
        assertThatNoException().isThrownBy(() -> service.validate(valid()));
    }

    @Test
    @DisplayName("busId veritabaninda yok — DeviceValidationException firlatilir")
    void validate_busId_yok() {
        given(busRepository.existsById(99L)).willReturn(false);
        DeviceInputDTO dto = new DeviceInputDTO(
                "CAM-001", 99L, null,
                CameraStatus.ACTIVE, DeviceBusStatus.RUNNING, NOW_ISO, 10
        );

        assertThatThrownBy(() -> service.validate(dto))
                .isInstanceOf(DeviceValidationException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("timestamp gelecekte (10 dk ileri) — DeviceValidationException firlatilir")
    void validate_timestamp_gelecekte() {
        String future = OffsetDateTime.now().plusMinutes(10)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        DeviceInputDTO dto = new DeviceInputDTO(
                "CAM-001", BUS_ID, null,
                CameraStatus.ACTIVE, DeviceBusStatus.RUNNING, future, 10
        );

        assertThatThrownBy(() -> service.validate(dto))
                .isInstanceOf(DeviceValidationException.class)
                .hasMessageContaining("gelecek");
    }

    @Test
    @DisplayName("cameraStatus=ERROR iken passengerCount>0 — tutarsizlik hatasi")
    void validate_kamera_hatali_ama_yolcu_var() {
        DeviceInputDTO dto = new DeviceInputDTO(
                "CAM-001", BUS_ID, null,
                CameraStatus.ERROR, DeviceBusStatus.RUNNING, NOW_ISO, 15
        );

        assertThatThrownBy(() -> service.validate(dto))
                .isInstanceOf(DeviceValidationException.class)
                .hasMessageContaining("ERROR");
    }

    @Test
    @DisplayName("busStatus=MAINTENANCE iken passengerCount>0 — tutarsizlik hatasi")
    void validate_bakim_ama_yolcu_var() {
        DeviceInputDTO dto = new DeviceInputDTO(
                "CAM-001", BUS_ID, null,
                CameraStatus.ACTIVE, DeviceBusStatus.MAINTENANCE, NOW_ISO, 5
        );

        assertThatThrownBy(() -> service.validate(dto))
                .isInstanceOf(DeviceValidationException.class)
                .hasMessageContaining("MAINTENANCE");
    }

    @Test
    @DisplayName("cameraStatus=ERROR ve passengerCount=0 — gecerli (tutarli)")
    void validate_kamera_hatali_yolcu_sifir_gecerli() {
        DeviceInputDTO dto = new DeviceInputDTO(
                "CAM-001", BUS_ID, null,
                CameraStatus.ERROR, DeviceBusStatus.RUNNING, NOW_ISO, 0
        );
        assertThatNoException().isThrownBy(() -> service.validate(dto));
    }
}
