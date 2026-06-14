package com.bus.occupancy.system.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Admin panelinden sofor adi / plaka atamasi - alanlar opsiyonel, sadece gonderilenler guncellenir
public record BusAssignmentDTO(

        @Size(max = 100, message = "Sofor adi en fazla 100 karakter olabilir")
        String driverName,

        @Pattern(regexp = "^[A-Z0-9 ]{4,15}$",
                 message = "Plaka yalnizca buyuk harf, rakam ve bosluk icerebilir (4-15 karakter)")
        String plateNumber

) {}
