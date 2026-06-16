-- Migración para agregar nuevos usuarios administradores
-- Fecha: 2026-04-07

INSERT INTO usuarios_gestor (email, password_hash, gestor, rol)
VALUES 
    ('sergio.elizondo@vesta-track.cloud', 'SergioVesta2026!', 'SERGIO ELIZONDO', 'admin'),
    ('ricardo.almaraz@vesta-track.cloud', 'RicardoVesta2026!', 'RICARDO ALMARAZ', 'admin'),
    ('natalie.torres@vesta-track.cloud', 'NatalieVesta2026!', 'NATALIE TORRES', 'admin')
ON CONFLICT (email) 
DO UPDATE SET 
    rol = 'admin', 
    password_hash = EXCLUDED.password_hash,
    gestor = EXCLUDED.gestor;
