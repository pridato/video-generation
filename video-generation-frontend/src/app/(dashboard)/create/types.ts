export interface Segmento {
  texto: string;
  duracion: number;
  tipo: string; // ej: "hook" | "contenido" | "cta"
}

export interface SelectedClip {
  clip_id: string;
  filename: string;
  file_url: string;
  duration: number;
  segment_text: string;
  segment_type: string;
  similarity_score: number;
  segment_score: number;
  final_score: number;
  duration_compatibility: number;
  quality_score: number;
  motion_intensity: string;
  concept_tags: string[];
  emotion_tags: string[];
  dominant_colors: string[];
}

export interface ClipSelectionResult {
  success: boolean;
  selected_clips: SelectedClip[];
  total_clips_duration: number;
  audio_duration: number;
  duration_compatibility: number;
  visual_coherence_score: number;
  estimated_engagement: number;
  warnings: string[];
  processing_time_ms: number;
  average_similarity: number;
  average_quality: number;
}

export interface ScriptResponse {
  script_mejorado: string;
  duracion_estimada: number;
  segmentos: Segmento[];
  palabras_clave: string[];
  tono: string;
  mejoras_aplicadas: string[];
  embedding?: number[];
  // Campos adicionales para el video completo
  script_original?: string;
  categoria?: string;
  fecha_creacion?: string;
  template_id?: string;
  voice_id?: string;
  speed?: number;
  // Datos de audio generado
  audio_data?: {
    audio_base64: string;
    filename: string;
    duration: number;
    voice_id: string;
    segments: Array<{
      text: string;
      type: string;
      emotion: string;
      duration: number;
      speed: number;
    }>;
  };
  // Datos de clips seleccionados
  clips_data?: ClipSelectionResult;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  color: string;
  isPremium: boolean;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  preview: string;
  gender: 'male' | 'female';
  language: string;
}

export interface SpeedOption {
  value: number;
  label: string;
  description: string;
}

export interface Categoria {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Step {
  id: number;
  title: string;
  icon: any; // LucideIcon type
}