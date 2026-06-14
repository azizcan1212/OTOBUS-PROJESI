package com.bus.occupancy.system.config.security;

import com.bus.occupancy.system.model.Role;
import com.bus.occupancy.system.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtService Unit Testleri")
class JwtServiceTest {

    // Test icin gecerli bir 256-bit Base64 secret (uretim degerinden farkli)
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHkh";

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        jwtService.validateSecretKey();

        testUser = new User();
        testUser.setUsername("testkullanici");
        testUser.setPassword("sifre");
        testUser.setRole(Role.ADMIN);
    }

    @Test
    @DisplayName("Token uretilir ve kullanici adi cozumlenebilir")
    void generateToken_ve_extractUsername() {
        String token = jwtService.generateToken(testUser);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("testkullanici");
    }

    @Test
    @DisplayName("Gecerli token dogrulama basarili")
    void isTokenValid_gecerli() {
        String token = jwtService.generateToken(testUser);

        assertThat(jwtService.isTokenValid(token, testUser)).isTrue();
    }

    @Test
    @DisplayName("Farkli kullanici icin token gecersiz")
    void isTokenValid_farkli_kullanici() {
        String token = jwtService.generateToken(testUser);

        User baskasi = new User();
        baskasi.setUsername("baskakisi");
        baskasi.setPassword("sifre2");
        baskasi.setRole(Role.DEVICE);

        assertThat(jwtService.isTokenValid(token, baskasi)).isFalse();
    }

    @Test
    @DisplayName("Bos secret ile startup IllegalStateException firlatir")
    void validateSecretKey_bos_secret() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", "");

        assertThatThrownBy(service::validateSecretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT secret");
    }

    @Test
    @DisplayName("Cok kisa secret ile startup IllegalStateException firlatir")
    void validateSecretKey_kisa_secret() {
        JwtService service = new JwtService();
        // Base64("kisa") = sadece 4 byte
        ReflectionTestUtils.setField(service, "secretKey", "a2lzYQ==");

        assertThatThrownBy(service::validateSecretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("256 bit");
    }
}
