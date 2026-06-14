package com.bus.occupancy.system.dto;

import java.time.LocalDateTime;

public record OccupancyLogResponseDTO(
        int occupancy,
        LocalDateTime createdAt
) {
}
