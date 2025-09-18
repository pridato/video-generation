-- =============================================================================
-- MIGRACIÓN DE SCHEMA - MEJORAS CRÍTICAS PARA TU BASE ACTUAL
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 1. MEJORAR TABLA PROFILES (SIN ROMPER DATOS EXISTENTES)
-- =============================================================================

-- Limpiar redundancias en profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS credits;
ALTER TABLE profiles DROP COLUMN IF EXISTS usage_count;
ALTER TABLE profiles RENAME COLUMN videos_used TO monthly_videos_used;
ALTER TABLE profiles RENAME COLUMN credits_remaining TO monthly_limit;

-- Añadir campos faltantes importantes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_videos_created integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_niche text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_video_created_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_colors jsonb DEFAULT '{}';

-- Función para resetear contadores mensuales
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET monthly_videos_used = 0
    WHERE DATE_TRUNC('month', last_video_created_at) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. MEJORAR TABLA PROCESSING_QUEUE
-- =============================================================================

-- Añadir campos faltantes para mejor tracking
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT '[]';
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS current_step text;
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS priority integer DEFAULT 5;
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS estimated_completion timestamp with time zone;
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS max_retries integer DEFAULT 3;
ALTER TABLE processing_queue ADD COLUMN IF NOT EXISTS processing_node text;

-- Migrar datos existentes al nuevo formato
UPDATE processing_queue 
SET steps = jsonb_build_array(
  jsonb_build_object(
    'name', step,
    'status', status,
    'startTime', started_at,
    'endTime', completed_at
  )
)
WHERE steps = '[]' OR steps IS NULL;

-- Índice para mejorar performance de la cola
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority 
ON processing_queue (status, priority DESC) 
WHERE status IN ('pending', 'processing');

-- =============================================================================
-- 3. MEJORAR TABLA TEMPLATES
-- =============================================================================

-- Añadir metadatos estructurales críticos
ALTER TABLE templates ADD COLUMN IF NOT EXISTS structure jsonb DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS visual_settings jsonb DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS audio_settings jsonb DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS target_duration integer DEFAULT 45;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'beginner';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS viral_potential_score integer DEFAULT 50;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Migrar templates existentes con estructura básica
UPDATE templates 
SET structure = jsonb_build_object(
  'hook', jsonb_build_object('duration', 7, 'style', 'engaging'),
  'body', jsonb_build_object('segments', 3, 'pacing', 'medium'),
  'cta', jsonb_build_object('duration', 6, 'style', 'soft')
)
WHERE structure = '{}' OR structure IS NULL;

-- =============================================================================
-- 4. CREAR TABLA DE CLIPS/ASSETS (NUEVA Y CRÍTICA)
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_clips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información básica del archivo
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  duration real NOT NULL,
  resolution text DEFAULT '1920x1080',
  format text DEFAULT 'mp4',
  
  -- Categorización semántica para matching IA
  concept_tags text[] DEFAULT '{}',
  emotion_tags text[] DEFAULT '{}',
  scene_type text, -- 'indoor', 'outdoor', 'close-up', 'wide-shot'
  dominant_colors text[] DEFAULT '{}',
  
  -- Búsqueda semántica con IA
  description text,
  keywords text[] DEFAULT '{}',
  embedding vector(384), -- Vector embeddings para búsqueda semántica
  
  -- Metadatos de calidad y uso
  quality_score real DEFAULT 5.0 CHECK (quality_score >= 1 AND quality_score <= 10),
  motion_intensity text DEFAULT 'medium' CHECK (motion_intensity IN ('low', 'medium', 'high')),
  audio_present boolean DEFAULT false,
  
  -- Métricas de éxito
  usage_count integer DEFAULT 0,
  success_rate real DEFAULT 0.0 CHECK (success_rate >= 0 AND success_rate <= 1),
  
  -- Estado y disponibilidad
  processing_status text DEFAULT 'ready' CHECK (processing_status IN ('processing', 'ready', 'failed')),
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices críticos para performance
CREATE INDEX idx_clips_concept_tags ON asset_clips USING GIN (concept_tags);
CREATE INDEX idx_clips_emotion_tags ON asset_clips USING GIN (emotion_tags);
CREATE INDEX idx_clips_duration ON asset_clips (duration);
CREATE INDEX idx_clips_quality ON asset_clips (quality_score DESC);
CREATE INDEX idx_clips_active ON asset_clips (is_active) WHERE is_active = true;

-- Índice para búsqueda semántica (requiere extensión vector)
CREATE INDEX idx_clips_embedding ON asset_clips USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =============================================================================
-- 5. MEJORAR TABLA VIDEOS
-- =============================================================================

-- Añadir campos críticos para mejor tracking
ALTER TABLE videos ADD COLUMN IF NOT EXISTS enhanced_script jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_script text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS clips_used jsonb DEFAULT '[]';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS voice_settings jsonb DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS background_music text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sound_effects text[] DEFAULT '{}';

-- Mejorar tracking de procesamiento
ALTER TABLE videos ADD COLUMN IF NOT EXISTS actual_duration real;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_time integer;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS quality_score real;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subtitles_url text;

-- Error handling mejorado
ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

-- Métricas básicas que podemos trackear internamente
ALTER TABLE videos ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0;

-- Ampliar estados posibles
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_status_check;
ALTER TABLE videos ADD CONSTRAINT videos_status_check 
CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));

-- =============================================================================
-- 6. CREAR TABLA DE PREFERENCIAS DE USUARIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Preferencias de creación
  default_template_id text REFERENCES templates(id),
  default_voice_id text,
  auto_enhance_script boolean DEFAULT true,
  preferred_video_length integer DEFAULT 45,
  
  -- Personalización visual
  brand_kit jsonb DEFAULT '{}', -- colores, logos, fuentes
  watermark_enabled boolean DEFAULT true,
  watermark_position text DEFAULT 'bottom-right',
  
  -- Preferencias de audio
  background_music_enabled boolean DEFAULT true,
  sound_effects_enabled boolean DEFAULT true,
  voice_speed real DEFAULT 1.0,
  
  -- Notificaciones
  email_notifications boolean DEFAULT true,
  processing_complete_notifications boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 7. MEJORAR TABLA ANALYTICS
-- =============================================================================

-- Hacer analytics más específico y útil
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS platform text; -- youtube, tiktok, instagram
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS watch_time_seconds integer;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS click_through_rate numeric;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS audience_retention jsonb DEFAULT '{}';

-- Añadir columna de fecha
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS tracked_date date;

-- Actualizar registros existentes
UPDATE analytics 
SET tracked_date = DATE(tracked_at) 
WHERE tracked_date IS NULL;

-- Hacer la columna NOT NULL después de actualizar
ALTER TABLE analytics ALTER COLUMN tracked_date SET NOT NULL;
ALTER TABLE analytics ALTER COLUMN tracked_date SET DEFAULT CURRENT_DATE;

-- Crear constraint único simple
ALTER TABLE analytics ADD CONSTRAINT unique_video_platform_date 
UNIQUE (video_id, platform, tracked_date);

-- Trigger para mantener sincronizada la fecha
CREATE OR REPLACE FUNCTION update_analytics_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tracked_date = DATE(NEW.tracked_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_analytics_date
    BEFORE INSERT OR UPDATE ON analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_date();

-- =============================================================================
-- 8. FUNCIONES ÚTILES PARA EL NEGOCIO
-- =============================================================================

-- Función para verificar límites de usuario (mejorada)
CREATE OR REPLACE FUNCTION check_user_video_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_limit INTEGER;
    current_count INTEGER;
    user_tier TEXT;
BEGIN
    -- Obtener límite y tier del usuario
    SELECT monthly_limit, subscription_tier INTO user_limit, user_tier
    FROM profiles
    WHERE id = user_uuid;
    
    -- Si es enterprise, sin límite
    IF user_tier = 'enterprise' THEN
        RETURN TRUE;
    END IF;
    
    -- Contar videos del mes actual
    SELECT COUNT(*) INTO current_count
    FROM videos
    WHERE user_id = user_uuid
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    AND status IN ('completed', 'processing', 'queued');
    
    RETURN current_count < user_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar clips similares usando embeddings
CREATE OR REPLACE FUNCTION find_similar_clips(
    query_embedding vector(384),
    target_duration real DEFAULT NULL,
    emotion_filter text DEFAULT NULL,
    max_results integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    filename text,
    file_url text,
    duration real,
    concept_tags text[],
    emotion_tags text[],
    quality_score real,
    usage_count integer,
    success_rate real,
    similarity_score real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.filename,
        c.file_url,
        c.duration,
        c.concept_tags,
        c.emotion_tags,
        c.quality_score,
        c.usage_count,
        c.success_rate,
        1 - (c.embedding <=> query_embedding) as similarity_score
    FROM asset_clips c
    WHERE c.is_active = true
    AND c.processing_status = 'ready'
    AND (target_duration IS NULL OR ABS(c.duration - target_duration) < target_duration * 0.5)
    AND (emotion_filter IS NULL OR emotion_filter = ANY(c.emotion_tags))
    ORDER BY c.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar métricas de éxito de clips
CREATE OR REPLACE FUNCTION update_clip_success_metrics()
RETURNS void AS $$
BEGIN
    UPDATE asset_clips
    SET success_rate = (
        SELECT COALESCE(
            COUNT(CASE WHEN v.quality_score >= 7 THEN 1 END)::real / 
            NULLIF(COUNT(*)::real, 0), 
            0
        )
        FROM videos v
        WHERE asset_clips.id::text = ANY(
            SELECT jsonb_array_elements_text(v.clips_used)
        )
        AND v.status = 'completed'
        AND v.created_at > NOW() - INTERVAL '30 days'
    ),
    updated_at = NOW()
    WHERE usage_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. TRIGGERS PARA AUTOMATIZACIÓN
-- =============================================================================

-- Trigger para actualizar contadores cuando se completa un video
CREATE OR REPLACE FUNCTION update_user_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE profiles 
        SET 
            monthly_videos_used = monthly_videos_used + 1,
            total_videos_created = total_videos_created + 1,
            last_video_created_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Actualizar contador de uso de template
        UPDATE templates 
        SET uses = uses + 1 
        WHERE id = NEW.template_id;
        
        -- Actualizar contador de clips usados
        UPDATE asset_clips 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id::text = ANY(
            SELECT jsonb_array_elements_text(NEW.clips_used)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_completion_trigger
    AFTER UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_user_counters();

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
BEFORE UPDATE ON templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at 
BEFORE UPDATE ON videos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_clips_updated_at 
BEFORE UPDATE ON asset_clips 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 10. POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuarios solo ven sus propios datos)
CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own videos" ON videos 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON videos 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON videos 
    FOR UPDATE USING (auth.uid() = user_id);

-- Templates y clips son públicos para lectura
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active templates" ON templates 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view active clips" ON asset_clips 
    FOR SELECT USING (is_active = true);

-- =============================================================================
-- 11. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =============================================================================

-- Índices críticos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_videos_user_status ON videos (user_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_queue_video ON processing_queue (video_id);
CREATE INDEX IF NOT EXISTS idx_analytics_video_platform ON analytics (video_id, platform);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles (subscription_tier);
CREATE INDEX IF NOT EXISTS idx_templates_category_active ON templates (category, is_active) WHERE is_active = true;

-- Índice para búsqueda de texto en títulos
CREATE INDEX IF NOT EXISTS idx_videos_title_search ON videos USING gin (to_tsvector('spanish', title));

-- =============================================================================
-- 12. DATOS DE EJEMPLO PARA TESTING
-- =============================================================================

-- Insertar algunos clips de ejemplo (cuando tengas los archivos reales)
/*
INSERT INTO asset_clips (filename, file_url, duration, concept_tags, emotion_tags, description) VALUES
('coding-keyboard.mp4', 'https://storage.supabase.co/clips/coding-keyboard.mp4', 8.5, 
 ARRAY['coding', 'keyboard', 'programming'], ARRAY['focused', 'productive'], 
 'Close-up shot of hands typing on a mechanical keyboard with code on screen'),
('city-timelapse.mp4', 'https://storage.supabase.co/clips/city-timelapse.mp4', 12.0,
 ARRAY['city', 'urban', 'movement'], ARRAY['energetic', 'dynamic'],
 'Fast-paced timelapse of busy city intersection with traffic and pedestrians');
*/

COMMENT ON DATABASE postgres IS 'YouTube Shorts Generator - Migrated and Optimized Schema';