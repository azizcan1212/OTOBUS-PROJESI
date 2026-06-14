package com.bus.occupancy.system.repository;

import com.bus.occupancy.system.model.ErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long> {

    Page<ErrorLog> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
}
