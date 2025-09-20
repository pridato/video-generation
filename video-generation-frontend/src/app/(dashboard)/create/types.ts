export interface Segmento {
  texto: string;
  duracion: number;
  tipo: string; // ej: "hook" | "contenido" | "cta"
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