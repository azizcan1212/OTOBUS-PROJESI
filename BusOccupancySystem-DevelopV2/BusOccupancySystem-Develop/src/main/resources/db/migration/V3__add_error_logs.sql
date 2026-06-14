-- ============================================================
-- V3 — error_logs tablosu: geçersiz cihaz isteklerinin kaydı
-- rawPayload her zaman saklanır (denetim ve hata ayıklama için)
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
    id            BIGSERIAL    PRIMARY KEY,
    camera_id     VARCHAR(50),
    bus_id        BIGINT,
    raw_payload   TEXT         NOT NULL,
    error_type    VARCHAR(30)  NOT NULL,
    error_message TEXT,
    endpoint      VARCHAR(200),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_camera_id  ON error_logs(camera_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
