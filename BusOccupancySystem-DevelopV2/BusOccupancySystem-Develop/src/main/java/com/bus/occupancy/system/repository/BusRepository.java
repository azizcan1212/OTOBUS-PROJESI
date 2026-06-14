package com.bus.occupancy.system.repository;

import com.bus.occupancy.system.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {

    boolean existsByPlateNumber(String plateNumber);

    boolean existsByPlateNumberAndIdNot(String plateNumber, Long id);
}
