-- ============================================================
-- V7 — Admin panelindeki hata-log goruntuleyicisi icin ornek kayitlar
-- Her ErrorType (MISSING_FIELD, VALIDATION_ERROR, MALFORMED_JSON) icin ornek
-- ============================================================

INSERT INTO error_logs (camera_id, bus_id, raw_payload, error_type, error_message, endpoint, created_at)
VALUES
    (NULL, NULL,
     '{"busId":1,"cameraStatus":"ACTIVE","busStatus":"RUNNING","timestamp":"2026-06-10T08:15:00+03:00","passengerCount":18}',
     'MISSING_FIELD', 'cameraId: bos olamaz', '/api/v1/device/input', NOW() - INTERVAL '3 days'),

    ('CAM-BUS34-001', 1,
     '{"cameraId":"CAM-BUS34-001","busId":1,"cameraStatus":"ERROR","busStatus":"RUNNING","timestamp":"2026-06-11T09:42:00+03:00","passengerCount":15}',
     'VALIDATION_ERROR', 'cameraStatus=ERROR iken passengerCount=15 gonderilmesi tutarsiz; kamera arizali veriyi guvenilir sayamayiz', '/api/v1/device/input', NOW() - INTERVAL '2 days'),

    ('CAM-BUS34-002', 2,
     '{"cameraId":"CAM-BUS34-002","busId":2,"cameraStatus":"ACTIVE","busStatus":"MAINTENANCE","timestamp":"2026-06-12T07:05:00+03:00","passengerCount":5}',
     'VALIDATION_ERROR', 'busStatus=MAINTENANCE iken passengerCount=5 gonderilemez; bakimdaki otobuslerde yolcu olmamalidir', '/api/v1/device/input', NOW() - INTERVAL '1 day'),

    ('CAM-BUS99-001', 9999,
     '{"cameraId":"CAM-BUS99-001","busId":9999,"cameraStatus":"ACTIVE","busStatus":"RUNNING","timestamp":"2026-06-12T18:30:00+03:00","passengerCount":10}',
     'VALIDATION_ERROR', 'busId=9999 sistemde kayitli degil', '/api/v1/device/input', NOW() - INTERVAL '12 hours'),

    (NULL, NULL,
     '{"cameraId":"CAM-BUS34-003","busId":3,"cameraStatus":"ACTIVE","busStatus":"RUNNING","timestamp":"2026-06-13',
     'MALFORMED_JSON', 'Gecersiz veya parse edilemeyen JSON govdesi: Unexpected end-of-input', '/api/v1/device/input', NOW() - INTERVAL '4 hours');
