package com.bus.occupancy.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bus extends BaseEntity {

    @Column(name = "occupancy")
    private int busOccupancy;

    // Maksimum yolcu kapasitesi — doluluk yuzdesi hesaplamak icin kullanilir
    @Column(name = "max_capacity")
    private int maxCapacity = 50;

    @Column(name = "line_code")
    private String lineCode;

    @Column(name = "route_name")
    private String routeName;

    @Column(name = "plate_number", unique = true)
    private String plateNumber;

    // Frontend fleetCode alani icin — ornegin "F-34" gibi filo kodu
    @Column(name = "fleet_code")
    private String fleetCode;

    // Otobusun mevcut durağı
    @Column(name = "current_stop")
    private String currentStop;

    // Guzergahin son duragi / hedef
    @Column(name = "destination")
    private String destination;

    // Gec kalis suresi (dakika cinsinden, yoksa null)
    @Column(name = "delay_in_minutes")
    private Integer delayInMinutes;

    // Sorumlu sofor ismi (yetkili alani)
    @Column(name = "driver_name")
    private String driverName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BusStatus status = BusStatus.ON_TIME;

    public int getOccupancyRate() {
        if (maxCapacity <= 0) return 0;
        return (int) Math.round((busOccupancy * 100.0) / maxCapacity);
    }
}
