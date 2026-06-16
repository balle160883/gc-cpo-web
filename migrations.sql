-- Migraciones para el Sistema de Cobranza Profesional

-- 1. Tabla de Interacciones de Cobranza (Bitácora de Gestiones)
CREATE TABLE IF NOT EXISTS cobranza_interacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id BIGINT NOT NULL REFERENCES socios_datos(socio_id),
    prestamo_id BIGINT REFERENCES prestamos_datos(prestamo_id),
    gestor_id UUID REFERENCES usuarios_gestor(id),
    fecha_gestion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_contacto TEXT CHECK (tipo_contacto IN ('llamada', 'visita', 'whatsapp', 'sms', 'correo', 'otro')),
    resultado TEXT NOT NULL, -- Ej: 'promesa_pago', 'reclamacion', 'no_encontrado', etc.
    descripcion TEXT,
    latitud NUMERIC,
    longitud NUMERIC,
    evidencia_url TEXT, -- Link a foto de visita si aplica
    sujeto_tipo TEXT DEFAULT 'Socio', -- 'Socio' o 'Aval'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Promesas de Pago
CREATE TABLE IF NOT EXISTS cobranza_promesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id BIGINT NOT NULL REFERENCES prestamos_datos(prestamo_id),
    interaccion_id UUID REFERENCES cobranza_interacciones(id),
    monto_prometido NUMERIC(15, 2) NOT NULL,
    fecha_promesa DATE NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cumplida', 'incumplida', 'cancelada')),
    notificado_whatsapp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Estrategias y Reglas de Cobranza
CREATE TABLE IF NOT EXISTS cobranza_estrategias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    dias_mora_min INTEGER NOT NULL,
    dias_mora_max INTEGER NOT NULL,
    segmento TEXT, -- Ej: 'Vivienda', 'Consumo'
    prioridad INTEGER DEFAULT 1,
    accion_automatica TEXT, -- Ej: 'enviar_sms_recordatorio'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Convenios de Pago (Reestructuras)
CREATE TABLE IF NOT EXISTS cobranza_convenios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id BIGINT NOT NULL REFERENCES prestamos_datos(prestamo_id),
    socio_id BIGINT NOT NULL REFERENCES socios_datos(socio_id),
    monto_total_convenio NUMERIC(15, 2) NOT NULL,
    parcialidades INTEGER NOT NULL,
    periodo_pagos TEXT CHECK (periodo_pagos IN ('semanal', 'quincenal', 'mensual')),
    fecha_inicio DATE NOT NULL,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'liquidado', 'incumplido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Ubicaciones de Gestores (Rastreo en Tiempo Real)
CREATE TABLE IF NOT EXISTS ubicaciones_gestores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gestor_id UUID REFERENCES usuarios_gestor(id),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Actualización de tabla de asignaciones para geolocalización de visitas
ALTER TABLE asignacion_gestores ADD COLUMN IF NOT EXISTS "LATITUD" NUMERIC;
ALTER TABLE asignacion_gestores ADD COLUMN IF NOT EXISTS "LONGITUD" NUMERIC;

-- Indexación para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_interacciones_socio ON cobranza_interacciones(socio_id);
CREATE INDEX IF NOT EXISTS idx_promesas_prestamo ON cobranza_promesas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_promesas_fecha ON cobranza_promesas(fecha_promesa);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_gestor ON ubicaciones_gestores(gestor_id);
