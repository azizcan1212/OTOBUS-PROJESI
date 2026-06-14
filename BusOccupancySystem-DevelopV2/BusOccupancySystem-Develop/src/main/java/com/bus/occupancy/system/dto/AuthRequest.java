package com.bus.occupancy.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(
        @NotBlank(message = "Kullanici adi bos olamaz")
        @Size(min = 3, max = 50, message = "Kullanici adi 3-50 karakter arasinda olmalidir")
        String username,

        @NotBlank(message = "Sifre bos olamaz")
        @Size(min = 6, message = "Sifre en az 6 karakter olmalidir")
        String password
) {
}
