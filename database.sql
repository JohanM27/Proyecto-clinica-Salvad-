
-- Estructura del Backend (SQL para Supabase)

-- 1. Perfiles de Usuarios
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Citas
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'BAC',
  attendees TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, request, confirmed, finished, cancelled, rescheduled
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  client_rating INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Configuración de la Clínica
CREATE TABLE clinic_config (
  id SERIAL PRIMARY KEY,
  is_open BOOLEAN DEFAULT true,
  working_hours JSONB DEFAULT '{
    "lunes": {"enabled": true, "start": "08:00", "end": "17:00"},
    "martes": {"enabled": true, "start": "08:00", "end": "17:00"},
    "miercoles": {"enabled": true, "start": "08:00", "end": "17:00"},
    "jueves": {"enabled": true, "start": "08:00", "end": "17:00"},
    "viernes": {"enabled": true, "start": "08:00", "end": "17:00"},
    "sabado": {"enabled": true, "start": "08:00", "end": "12:00"}
  }'::jsonb
);

-- Insertar configuración inicial
INSERT INTO clinic_config (is_open) VALUES (true);
