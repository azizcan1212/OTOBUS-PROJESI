-- ============================================================
-- V2 — Demo verisi: geliştirme ve test ortamı için örnek filolar
-- Uretim ortamında bu migration'ı çalıştırmak istemiyorsanız
-- spring.flyway.locations=classpath:db/migration/prod gibi profil
-- bazlı konum ayarı kullanabilirsiniz.
-- ============================================================

INSERT INTO bus (line_code, route_name, plate_number, fleet_code, current_stop, destination,
                 occupancy, max_capacity, status)
VALUES
    ('34A', 'Kadıköy - Taksim',         '34 ABC 001', 'F-001', 'Kadikoy Iskele',   'Taksim Meydani',   22, 50, 'ON_TIME'),
    ('34B', 'Üsküdar - Beşiktaş',       '34 DEF 002', 'F-002', 'Uskudar Camii',    'Besiktas Iskele',  40, 50, 'ON_TIME'),
    ('34C', 'Maltepe - Bağcılar',       '34 GHI 003', 'F-003', 'Maltepe Metro',    'Bagcilar Terminal',10, 50, 'DELAYED'),
    ('34D', 'Sarıyer - Mecidiyeköy',    '34 JKL 004', 'F-004', 'Sariyer Sahil',    'Mecidiyekoy',      35, 50, 'ON_TIME'),
    ('34E', 'Pendik - Kadıköy',         '34 MNO 005', 'F-005', 'Pendik Terminal',  'Kadikoy Iskele',    0, 50, 'OUT_OF_SERVICE')
ON CONFLICT (plate_number) DO NOTHING;
