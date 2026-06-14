-- ============================================================
-- V4 — Demo otobüslere şoför ve ek alan güncellemesi
-- ============================================================

UPDATE bus SET
    driver_name      = 'Mehmet Yilmaz',
    fleet_code       = 'F-001',
    current_stop     = 'Kadikoy Iskele',
    destination      = 'Taksim Meydani'
WHERE plate_number = '34 ABC 001';

UPDATE bus SET
    driver_name      = 'Ali Kaya',
    fleet_code       = 'F-002',
    current_stop     = 'Uskudar Camii',
    destination      = 'Besiktas Iskele'
WHERE plate_number = '34 DEF 002';

UPDATE bus SET
    driver_name      = 'Ayse Demir',
    fleet_code       = 'F-003',
    current_stop     = 'Maltepe Metro',
    destination      = 'Bagcilar Terminal'
WHERE plate_number = '34 GHI 003';

UPDATE bus SET
    driver_name      = 'Hasan Celik',
    fleet_code       = 'F-004',
    current_stop     = 'Sariyer Sahil',
    destination      = 'Mecidiyekoy'
WHERE plate_number = '34 JKL 004';

UPDATE bus SET
    driver_name      = 'Fatma Sahin',
    fleet_code       = 'F-005',
    current_stop     = 'Pendik Terminal',
    destination      = 'Kadikoy Iskele'
WHERE plate_number = '34 MNO 005';
