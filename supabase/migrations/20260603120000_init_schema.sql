-- =====================================================================
-- Turnito SaaS Database Migration: Schema Initialization
-- Compatible con PostgreSQL y Supabase RLS
-- =====================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- btree_gist es requerido para crear restricciones de exclusión sobre tipos de datos mixtos (ej. UUID + Rango de Tiempo)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =====================================================================
-- Funciones Auxiliares Generales
-- =====================================================================

-- Función para actualizar automáticamente el campo updated_at al modificar registros
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 2. Tabla: profiles
-- =====================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger para automatizar la creación de perfiles cuando se registra un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 3. Tabla: businesses (Tenants Principales)
-- =====================================================================
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) >= 2),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9-]+$'), -- Solo minúsculas, números y guiones
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. Tabla: employees
-- =====================================================================
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Puede ser NULL antes de que el empleado se registre en la App
    full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Validación regex de email
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')) DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_business_profile_employee UNIQUE (business_id, profile_id)
);

-- Habilitar RLS en employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 5. Tabla: services
-- =====================================================================
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) >= 2),
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 6. Tabla: schedules (Horarios Laborales de los Empleados)
-- =====================================================================
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0: Domingo, 6: Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_end_time_after_start CHECK (end_time > start_time),
    CONSTRAINT unique_employee_day_slot UNIQUE (employee_id, day_of_week, start_time)
);

-- Habilitar RLS en schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 7. Tabla: appointments (Reservas / Turnos)
-- =====================================================================
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Opcional (permite checkouts de invitados)
    employee_id UUID REFERENCES public.employees(id) ON DELETE RESTRICT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    client_name TEXT NOT NULL CHECK (char_length(client_name) >= 2),
    client_email TEXT NOT NULL CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    client_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_appointment_time CHECK (end_time > start_time),
    
    -- Restricción de exclusión física: Impide que se reserve el mismo empleado a la misma hora 
    -- Excepto si la cita anterior fue cancelada (status != 'cancelled')
    CONSTRAINT appointments_no_employee_overlap EXCLUDE USING gist (
        employee_id WITH =, 
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status != 'cancelled')
);

-- Habilitar RLS en appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 8. Tabla: notifications
-- =====================================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Destinatario
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('appointment_created', 'appointment_confirmed', 'appointment_cancelled', 'reminder', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Asignación de Triggers de Timestamps (updated_at)
-- =====================================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Índices para Optimización de Consultas Multi-tenant
-- =====================================================================

-- Búsqueda de negocios por slug único (Frecuente para Landing Page)
CREATE INDEX idx_businesses_slug ON public.businesses(slug);

-- Búsqueda de empleados en un negocio específico (Dashboard y Formulario de Reserva)
CREATE INDEX idx_employees_business_id ON public.employees(business_id);
CREATE INDEX idx_employees_profile_id ON public.employees(profile_id);

-- Consultas de servicios activos de un negocio (Booking Widget)
CREATE INDEX idx_services_business_active ON public.services(business_id, is_active);

-- Horarios de empleados de un negocio (Generación de slots libres)
CREATE INDEX idx_schedules_employee_day ON public.schedules(employee_id, day_of_week);
CREATE INDEX idx_schedules_business_id ON public.schedules(business_id);

-- Citas de un negocio filtradas por fechas (Calendario del Dashboard tenant)
CREATE INDEX idx_appointments_business_dates ON public.appointments(business_id, start_time, end_time);
-- Citas de un empleado específico por fecha (Calendario del empleado)
CREATE INDEX idx_appointments_employee_dates ON public.appointments(employee_id, start_time, end_time);
-- Citas históricas de un cliente (App móvil / Panel de clientes)
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);

-- Notificaciones no leídas por usuario
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_business_id ON public.notifications(business_id);

-- =====================================================================
-- Funciones Auxiliares de Seguridad para RLS (Row Level Security)
-- =====================================================================

-- Función para validar si el usuario autenticado es dueño del negocio
CREATE OR REPLACE FUNCTION public.is_business_owner(business_uuid UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = business_uuid AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Función para validar si el usuario autenticado es empleado activo del negocio
CREATE OR REPLACE FUNCTION public.is_business_employee(business_uuid UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.employees
        WHERE business_id = business_uuid AND profile_id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el rol laboral del usuario en un negocio
CREATE OR REPLACE FUNCTION public.get_employee_role(business_uuid UUID)
RETURNS TEXT SECURITY DEFINER AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.employees
    WHERE business_id = business_uuid AND profile_id = auth.uid() AND is_active = true
    LIMIT 1;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 9. Políticas de Seguridad (Row Level Security - RLS)
-- =====================================================================

------------------------------------------------------------------------
-- Políticas para 'profiles'
------------------------------------------------------------------------
-- Lectura: Cualquier usuario autenticado puede ver perfiles (para buscar clientes/empleados)
CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Escritura: Solo el propio usuario puede actualizar su perfil
CREATE POLICY "Permitir actualización de perfil propio"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

------------------------------------------------------------------------
-- Políticas para 'businesses'
------------------------------------------------------------------------
-- Lectura pública: Clientes anon/autenticados pueden leer la landing pública de un negocio
CREATE POLICY "Permitir lectura pública de negocios"
    ON public.businesses FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserción: Cualquier usuario autenticado puede registrar su propio negocio
CREATE POLICY "Permitir creación de negocios a usuarios autenticados"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Actualización: Solo el propietario del negocio puede modificarlo
CREATE POLICY "Permitir actualización de negocios al propietario"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

------------------------------------------------------------------------
-- Políticas para 'employees'
------------------------------------------------------------------------
-- Lectura: Cualquier persona puede listar empleados de un negocio (para elegir con quién agendar)
CREATE POLICY "Permitir lectura de empleados"
    ON public.employees FOR SELECT
    TO anon, authenticated
    USING (is_active = true OR public.is_business_employee(business_id) OR public.is_business_owner(business_id));

-- Escritura total: Solo dueños, administradores o managers del negocio pueden alterar la lista de empleados
CREATE POLICY "Permitir administración de empleados a dueños y administradores"
    ON public.employees FOR ALL
    TO authenticated
    USING (
        public.is_business_owner(business_id) 
        OR (public.is_business_employee(business_id) AND public.get_employee_role(business_id) IN ('admin', 'manager'))
    );

------------------------------------------------------------------------
-- Políticas para 'services'
------------------------------------------------------------------------
-- Lectura: Anon y clientes leen servicios activos. Propietarios y staff leen todos los servicios.
CREATE POLICY "Permitir lectura de servicios"
    ON public.services FOR SELECT
    TO anon, authenticated
    USING (
        (is_active = true) 
        OR public.is_business_owner(business_id) 
        OR public.is_business_employee(business_id)
    );

-- Escritura total: Solo dueños, administradores o managers de negocio
CREATE POLICY "Permitir administración de servicios a gestores"
    ON public.services FOR ALL
    TO authenticated
    USING (
        public.is_business_owner(business_id) 
        OR (public.is_business_employee(business_id) AND public.get_employee_role(business_id) IN ('admin', 'manager'))
    );

------------------------------------------------------------------------
-- Políticas para 'schedules'
------------------------------------------------------------------------
-- Lectura: Cualquier persona puede ver horarios disponibles para reservar turnos
CREATE POLICY "Permitir lectura de horarios"
    ON public.schedules FOR SELECT
    TO anon, authenticated
    USING (is_active = true OR public.is_business_employee(business_id) OR public.is_business_owner(business_id));

-- Escritura total: Solo administradores del negocio
CREATE POLICY "Permitir administración de horarios a gestores"
    ON public.schedules FOR ALL
    TO authenticated
    USING (
        public.is_business_owner(business_id) 
        OR (public.is_business_employee(business_id) AND public.get_employee_role(business_id) IN ('admin', 'manager'))
    );

------------------------------------------------------------------------
-- Políticas para 'appointments' (Aislamiento de Citas)
------------------------------------------------------------------------
-- Lectura: Staff/Propietario del negocio ve todas las citas. Clientes ven solo las suyas.
CREATE POLICY "Permitir lectura de citas a dueños y staff"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (
        public.is_business_owner(business_id) 
        OR public.is_business_employee(business_id)
        OR (client_id = auth.uid())
    );

-- Inserción: Clientes autenticados y visitantes anónimos (si aplica checkout de invitado)
CREATE POLICY "Permitir reserva de citas"
    ON public.appointments FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- Si está autenticado, obligar a que se asocie con su client_id
        (auth.role() = 'authenticated' AND client_id = auth.uid())
        -- Si es anónimo, el client_id debe ser obligatoriamente NULL
        OR (auth.role() = 'anon' AND client_id IS NULL)
    );

-- Actualización: Solo dueños/staff del negocio, o el cliente dueño de la cita
CREATE POLICY "Permitir actualización de citas a gestores o al cliente propietario"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (
        public.is_business_owner(business_id)
        OR public.is_business_employee(business_id)
        OR (client_id = auth.uid())
    )
    WITH CHECK (
        public.is_business_owner(business_id)
        OR public.is_business_employee(business_id)
        OR (client_id = auth.uid())
    );

------------------------------------------------------------------------
-- Políticas para 'notifications'
------------------------------------------------------------------------
-- Lectura: Solo el destinatario puede ver sus notificaciones
CREATE POLICY "Permitir lectura de notificaciones al destinatario"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Actualización: Solo el destinatario puede marcar como leídas
CREATE POLICY "Permitir actualización de notificaciones al destinatario"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Inserción: El servidor (o dueños/staff de negocios al gestionar turnos) puede crear notificaciones
CREATE POLICY "Permitir inserción de notificaciones al staff"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_business_owner(business_id)
        OR public.is_business_employee(business_id)
    );
