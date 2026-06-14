package com.bus.occupancy.system.repository;

import com.bus.occupancy.system.dto.OccupancyLogResponseDTO;
import com.bus.occupancy.system.model.OccupancyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OccupancyLogRepository extends JpaRepository<OccupancyLog, Long> {

    // Belirli bir otobuse ait gecmis doluluk kayitlarini getirir (BusDetailPage grafigi icin)
    @Query("SELECT new com.bus.occupancy.system.dto.OccupancyLogResponseDTO(o.occupancy, o.createdAt) " +
            "FROM OccupancyLog o WHERE o.bus.id = :busId ORDER BY o.createdAt ASC")
    List<OccupancyLogResponseDTO> findAllByBusId(@Param("busId") Long busId);

    // Statistics endpoint icin tarih araligina gore filtrelenebilir log sorgusi
    @Query("SELECT o FROM OccupancyLog o WHERE o.createdAt >= :startAt ORDER BY o.createdAt ASC")
    List<OccupancyLog> findAllSince(@Param("startAt") LocalDateTime startAt);
}
