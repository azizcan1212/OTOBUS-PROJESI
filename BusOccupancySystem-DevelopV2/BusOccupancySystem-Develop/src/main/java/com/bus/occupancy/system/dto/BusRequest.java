package com.bus.occupancy.system.dto;

import com.bus.occupancy.system.model.BusStatus;
import jakarta.validation.constraints.*;

public record BusRequest(

        @NotBlank(message = "Hat kodu bos olamaz")
        @Size(max = 20, message = "Hat kodu en fazla 20 karakter olabilir")
        String lineCode,

        @NotBlank(message = "Guzergah adi bos olamaz")
        @Size(max = 100, message = "Guzergah adi en fazla 100 karakter olabilir")
        String routeName,

        @NotBlank(message = "Plaka bos olamaz")
        @Pattern(regexp = "^[A-Z0-9 ]{4,15}$",
                 message = "Plaka yalnizca buyuk harf, rakam ve bosluk icerebilir (4-15 karakter)")
        String plateNumber,

        // Opsiyonel alanlar — null gelebilir, gelmezse Bus entity default degeri kullanir
        @Size(max = 20, message = "Filo kodu en fazla 20 karakter olabilir")
        String fleetCode,

        @Size(max = 100, message = "Mevcut durak en fazla 100 karakter olabilir")
        String currentStop,

        @Size(max = 100, message = "Hedef en fazla 100 karakter olabilir")
        String destination,

        @Min(value = 1, message = "Kapasite en az 1 olmalidir")
        @Max(value = 500, message = "Kapasite en fazla 500 olmalidir")
        Integer maxCapacity,

        @Size(max = 100, message = "Sofor adi en fazla 100 karakter olabilir")
        String driverName,

        BusStatus status

) {}
