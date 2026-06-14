-- ============================================================
-- V6 — Istatistik paneli icin gecmis doluluk verisi
-- Son 30 gun, 2 saatte bir, gunluk sinus deseniyle (yogun saat simulasyonu)
-- OUT_OF_SERVICE otobusler haric tutulur
-- ============================================================

INSERT INTO occupancy_logs (bus_id, occupancy, created_at, updated_at)
SELECT
    data.bus_id,
    GREATEST(0, LEAST(data.max_capacity, data.raw_occupancy)),
    data.ts,
    data.ts
FROM (
    SELECT
        b.id AS bus_id,
        b.max_capacity AS max_capacity,
        series.ts AS ts,
        ROUND((b.max_capacity * (0.5 + 0.4 * SIN(RADIANS((EXTRACT(HOUR FROM series.ts) * 15 + b.id * 37)::double precision))) + (RANDOM() * 6 - 3))::numeric)::int AS raw_occupancy
    FROM bus b
    CROSS JOIN (
        SELECT NOW() - (gs * INTERVAL '2 hours') AS ts
        FROM generate_series(0, 359) AS gs
    ) AS series
    WHERE b.status <> 'OUT_OF_SERVICE'
) AS data;
