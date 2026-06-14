package com.bus.occupancy.system.model;

/**
 * Cihazın (kamera modülünün) fiziksel durumu.
 * Cihaz bu değerlerden farklı bir string gönderirse Jackson
 * HttpMessageNotReadableException fırlatır → ErrorLog'a düşer.
 */
public enum CameraStatus {
    ACTIVE,
    INACTIVE,
    ERROR
}
