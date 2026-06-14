package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.config.security.CustomAuthenticationEntryPoint;
import com.bus.occupancy.system.config.security.JwtAuthenticationFilter;
import com.bus.occupancy.system.config.security.JwtService;
import com.bus.occupancy.system.config.security.SecurityConfiguration;
import com.bus.occupancy.system.config.security.UserDetailsServiceImpl;
import com.bus.occupancy.system.exception.DeviceValidationException;
import com.bus.occupancy.system.model.ErrorLog;
import com.bus.occupancy.system.service.DeviceValidationService;
import com.bus.occupancy.system.service.ErrorLogService;
import com.bus.occupancy.system.service.VerificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// excludeAutoConfiguration: UserDetailsServiceAutoConfiguration test slice'inda
// "inMemoryUserDetailsManager" adinda ekstra bir UserDetailsService bean'i olusturuyor.
// @MockBean UserDetailsServiceImpl ile birlikte bu, NoUniqueBeanDefinitionException'a
// (iki UserDetailsService bean'i, ikisi de @Primary degil) yol aciyordu.
// Asil UserDetailsServiceImpl @Primary olsa da, slice context'inde @Service taranmadigi
// icin onun yerine anotasyonsuz bir mock devreye giriyor — @Primary devreye girmiyordu.
//
// @Import(SecurityConfiguration...): @WebMvcTest varsayilan olarak ozel SecurityConfiguration
// bean'imizi yuklemiyor; bunun yerine Spring Boot'un varsayilan guvenlik zinciri devreye giriyor
// (CSRF acik, rol bazli yetki kurallari yok — sadece authenticated() kontrolu).
// Bu da "VIEWER rolu 403 almali" gibi rol bazli testlerin yanlis gecmesine/kalmasina yol aciyordu.
// Gercek SecurityConfiguration'i (ve onun bagimliliklari JwtAuthenticationFilter,
// CustomAuthenticationEntryPoint'i) import ederek uretimdeki gercek yetkilendirme
// davranisini (hasAnyRole DEVICE/ADMIN, CSRF kapali) test ortamina tasiyoruz.
@WebMvcTest(controllers = DeviceController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfiguration.class, JwtAuthenticationFilter.class, CustomAuthenticationEntryPoint.class})
@DisplayName("DeviceController Slice Testleri")
class DeviceControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean DeviceValidationService deviceValidationService;
    @MockBean VerificationService verificationService;
    @MockBean ErrorLogService errorLogService;
    @MockBean JwtService jwtService;
    @MockBean UserDetailsServiceImpl userDetailsService;

    private static final String VALID_BODY = """
            {
              "cameraId": "CAM-001",
              "busId": 1,
              "cameraStatus": "ACTIVE",
              "busStatus": "RUNNING",
              "timestamp": "2024-06-03T14:30:00+03:00",
              "passengerCount": 20
            }
            """;

    @Test
    @DisplayName("Gecerli istek — 204 No Content")
    @WithMockUser(roles = "DEVICE")
    void submitDeviceInput_204() throws Exception {
        willDoNothing().given(deviceValidationService).validate(any());
        willDoNothing().given(verificationService).process(any());

        mockMvc.perform(post("/api/v1/device/input")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isNoContent());

        then(errorLogService).should(never()).save(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Is kurali hatasi — 422 ve ErrorLog kaydedilir")
    @WithMockUser(roles = "DEVICE")
    void submitDeviceInput_422_is_kurali_hatasi() throws Exception {
        willThrow(new DeviceValidationException("busId 99 sistemde kayitli degil",
                ErrorLog.ErrorType.VALIDATION_ERROR))
                .given(deviceValidationService).validate(any());

        mockMvc.perform(post("/api/v1/device/input")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isUnprocessableEntity());

        then(errorLogService).should().save(any(), any(), any(),
                eq(ErrorLog.ErrorType.VALIDATION_ERROR), any(), any());
        then(verificationService).should(never()).process(any());
    }

    @Test
    @DisplayName("Sema hatasi (eksik cameraId) — 400")
    @WithMockUser(roles = "DEVICE")
    void submitDeviceInput_400_eksik_alan() throws Exception {
        String body = """
                {
                  "busId": 1,
                  "cameraStatus": "ACTIVE",
                  "busStatus": "RUNNING",
                  "timestamp": "2024-06-03T14:30:00Z"
                }
                """;

        mockMvc.perform(post("/api/v1/device/input")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("cameraId")));
    }

    @Test
    @DisplayName("Gecersiz enum degeri — 400")
    @WithMockUser(roles = "DEVICE")
    void submitDeviceInput_400_gecersiz_enum() throws Exception {
        String body = """
                {
                  "cameraId": "CAM-001",
                  "busId": 1,
                  "cameraStatus": "YANLIS_DEGER",
                  "busStatus": "RUNNING",
                  "timestamp": "2024-06-03T14:30:00Z"
                }
                """;

        mockMvc.perform(post("/api/v1/device/input")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GECICI: AI entegrasyonu icin endpoint herkese acik — auth olmadan 204")
    // GECICI: AI ekibi entegrasyon asamasinda token olmadan istek atabilsin diye
    // SecurityConfiguration'da bu endpoint permitAll yapildi. Entegrasyon bitince
    // bu test eski haline (VIEWER -> 403, hasAnyRole ADMIN/DEVICE) donmeli.
    void submitDeviceInput_204_anonim_gecici() throws Exception {
        willDoNothing().given(deviceValidationService).validate(any());
        willDoNothing().given(verificationService).process(any());

        mockMvc.perform(post("/api/v1/device/input")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isNoContent());
    }
}
