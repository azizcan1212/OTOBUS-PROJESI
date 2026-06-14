-- ============================================================
-- V1 — Temel şema: users, bus, occupancy_logs tabloları
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL    PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus (
    id                BIGSERIAL    PRIMARY KEY,
    occupancy         INTEGER      NOT NULL DEFAULT 0,
    max_capacity      INTEGER      NOT NULL DEFAULT 50,
    line_code         VARCHAR(20)  NOT NULL,
    route_name        VARCHAR(100) NOT NULL,
    plate_number      VARCHAR(15)  NOT NULL UNIQUE,
    fleet_code        VARCHAR(20),
    current_stop      VARCHAR(100),
    destination       VARCHAR(100),
    delay_in_minutes  INTEGER,
    driver_name       VARCHAR(100),
    status            VARCHAR(20)  NOT NULL DEFAULT 'ON_TIME',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS occupancy_logs (
    id          BIGSERIAL  PRIMARY KEY,
    bus_id      BIGINT     NOT NULL REFERENCES bus(id) ON DELETE CASCADE,
    occupancy   INTEGER    NOT NULL,
    created_at  TIMESTAMP  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occupancy_logs_bus_id     ON occupancy_logs(bus_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_logs_created_at ON occupancy_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_bus_plate_number          ON bus(plate_number);
CREATE INDEX IF NOT EXISTS idx_bus_line_code             ON bus(line_code);
CREATE INDEX IF NOT EXISTS idx_bus_status                ON bus(status);
