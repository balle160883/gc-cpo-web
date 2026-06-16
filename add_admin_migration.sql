-- 1. Agregar columna de rol a usuarios_gestor
ALTER TABLE usuarios_gestor ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'gestor';

-- 2. Crear usuario administrador
-- Nota: La contraseña se guardará en texto plano si no se usa un hash de bcrypt, 
-- pero el sistema es compatible con ambos según auth.service.ts
INSERT INTO usuarios_gestor (email, password_hash, gestor, rol)
VALUES ('ing.ballesteros16@gmail.com', 'Seguridad2026@', 'Administrador Global', 'admin')
ON CONFLICT (email) DO UPDATE SET rol = 'admin', password_hash = 'Seguridad2026@';
