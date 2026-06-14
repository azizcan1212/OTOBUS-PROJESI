package com.bus.occupancy.system.model;

/**
 * Otobusun anlık operasyon durumunu temsil eder.
 * Frontend bu enum degerlerini renk kodlama ve badge gosterimi icin kullanir.
 */
public enum BusStatus {
    ON_TIME,
    DELAYED,
    OUT_OF_SERVICE
}
