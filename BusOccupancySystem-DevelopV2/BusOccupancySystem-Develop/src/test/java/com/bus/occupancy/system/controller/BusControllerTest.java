package com.bus.occupancy.system.controller;

import com.bus.occupancy.system.config.security.CustomAuthenticationEntryPoint;
import com.bus.occupancy.system.config.security.JwtAuthenticationFilter;
import com.bus.occupancy.system.config.security.JwtService;
import com.bus.occupancy.system.config.security.SecurityConfiguration;
import com.bus.occupancy.system.config.security.UserDetailsServiceImpl;
import com.bus.occupancy.system.dto.BusSummaryDto;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.service.BusService;
import com.bus.occupancy.system.service.ErrorLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// excludeAutoConfiguration: UserDetailsServiceAutoConfiguration test slice'inda
// "inMemoryUserDetailsManager" adinda ekstra bir UserDetailsService bean'i olusturuyor.
// @MockBean UserDetailsServiceImpl ile birlikte bu, NoUniqueBeanDefinitionException'a
// (iki UserDetailsService bean'i, ikisi de @Primary degil) yol aciyordu.
//
// @Import(SecurityConfiguration...): @WebMvcTest ozel SecurityConfiguration bean'imizi
// otomatik yuklemiyor; varsayilan guvenlik zinciri (CSRF acik, rol bazli kural yok) devreye
// girip "ADMIN 200 donmeli / VIEWER 403 almali" gibi rol bazli testleri yanlis sonuclandiriyordu.
// Gercek SecurityConfiguration + bagimliliklarini import ederek uretimdeki
// (hasRole/hasAnyRole + CSRF kapali) davranisi test ortamina tasiyoruz.
@WebMvcTest(controllers = BusController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfiguration.class, JwtAuthenticationFilter.class, CustomAuthenticationEntryPoint.class})
@DisplayName("BusController Slice Testleri")
class BusControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    BusService busService;

    // WebMvcTest Security icin zorunlu mock'lar
    @MockBean
    JwtService jwtService;
    @MockBean
    UserDetailsServiceImpl userDetailsService;

    // GlobalExceptionHandler (@ControllerAdvice) constructor'i ErrorLogService'e bagimli;
    // slice context'i bu bean'i bulamadigindan UnsatisfiedDependencyException firlatiyordu.
    @MockBean
    ErrorLogService errorLogService;

    private BusSummaryDto buildSummary(Long id, String lineCode) {
        return new BusSummaryDto(
                id, lineCode, "Test Rota", "34 TST 00" + id,
                "F-00" + id, "Durak A", "Hedef B",
                15, 50, 30, null, null,
                BusStatus.ON_TIME, null
        );
    }

    @Test
    @DisplayName("GET /api/v1/buses — 200 ve otobus listesi doner")
    @WithMockUser
    void getAllBuses_200() throws Exception {
        var page = new PageImpl<>(List.of(buildSummary(1L, "34A"), buildSummary(2L, "34B")),
                PageRequest.of(0, 20), 2);
        given(busService.getAllBuses(any())).willReturn(page);

        mockMvc.perform(get("/api/v1/buses").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].lineCode").value("34A"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/buses/{id} — 404 var olmayan otobus")
    @WithMockUser
    void getBusById_404() throws Exception {
        given(busService.getBusById(99L))
                .willThrow(new jakarta.persistence.EntityNotFoundException("Otobus bulunamadi, id: 99"));

        mockMvc.perform(get("/api/v1/buses/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ENTITY_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /api/v1/buses/{id}/occupancy — 403 yetkisiz kullanici")
    @WithMockUser(roles = "VIEWER")
    void updateOccupancy_403_yetkisiz() throws Exception {
        mockMvc.perform(post("/api/v1/buses/1/occupancy")
                        .param("occupancy", "50"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/buses/{id}/occupancy — 200 ADMIN yetkili guncelleme")
    @WithMockUser(roles = "ADMIN")
    void updateOccupancy_200_admin() throws Exception {
        given(busService.updateOccupancy(1L, 50)).willReturn(buildSummary(1L, "34A"));

        mockMvc.perform(post("/api/v1/buses/1/occupancy")
                        .param("occupancy", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lineCode").value("34A"));
    }

    @Test
    @DisplayName("POST /api/v1/buses — 400 gecersiz plaka formati")
    @WithMockUser(roles = "ADMIN")
    void createBus_400_gecersiz_plaka() throws Exception {
        String body = """
                {
                  "lineCode": "34A",
                  "routeName": "Test Rota",
                  "plateNumber": "geçersiz!!!"
                }
                """;

        mockMvc.perform(post("/api/v1/buses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }
}
