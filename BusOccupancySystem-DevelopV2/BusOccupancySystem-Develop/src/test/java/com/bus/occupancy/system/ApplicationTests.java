package com.bus.occupancy.system;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Spring context yuklenme testi.
 * test/resources/application.properties icindeki H2 ve test JWT secret kullanilir.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Spring Context Yuklenme Testi")
class ApplicationTests {

    @Test
    @DisplayName("Application context basariyla yuklenir")
    void contextLoads() {
        // Context hatasiz yukleniyorsa test gecer
    }
}
