package com.bus.occupancy.system.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Bus Entity — getOccupancyRate() Hesaplama Testleri")
class BusTest {

    @ParameterizedTest(name = "{0} yolcu / {1} kapasite = %{2}")
    @CsvSource({
            "0,   50, 0",
            "25,  50, 50",
            "50,  50, 100",
            "1,   3,  33",
            "2,   3,  67",
            "10,  50, 20",
            "45,  50, 90",
            "0,   0,  0",    // sifir kapasite korunmasi
    })
    @DisplayName("Doluluk orani dogru hesaplanir")
    void occupancyRate_hesaplama(int occupancy, int capacity, int expectedRate) {
        Bus bus = new Bus();
        bus.setBusOccupancy(occupancy);
        bus.setMaxCapacity(capacity);

        assertThat(bus.getOccupancyRate()).isEqualTo(expectedRate);
    }
}
