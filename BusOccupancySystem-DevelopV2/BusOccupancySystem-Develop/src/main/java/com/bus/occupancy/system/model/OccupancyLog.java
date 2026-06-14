package com.bus.occupancy.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "occupancy_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyLog extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @Column(name = "occupancy")
    private int occupancy;

}
