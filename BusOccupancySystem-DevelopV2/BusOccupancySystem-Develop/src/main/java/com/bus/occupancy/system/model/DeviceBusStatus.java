package com.bus.occupancy.system.model;

/**
 * Cihazın bildirdiği otobüs operasyon durumu.
 * BusStatus (ON_TIME/DELAYED/OUT_OF_SERVICE) frontend gösterim katmanına aittir;
 * bu enum ise cihaz/AI giriş katmanına özgüdür ve ayrı tutulur.
 */
public enum DeviceBusStatus {
    RUNNING,
    STOPPED,
    MAINTENANCE
}
