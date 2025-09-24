"""
OpenAI service implementation for script enhancement and audio generation
"""
import json
import logging
from typing import Dict, Any, List, Optional

from .client import OpenAIClient
from app.domain.entities.script import Script, SegmentoScript, TipoSegmento, Tono, Categoria

logger = logging.getLogger(__name__)


class OpenAIScriptService:
    """Servicio para mejora de scripts usando OpenAI."""

    def __init__(self):
        self.client = OpenAIClient()

    def _create_system_prompt(self) -> str:
        """Crea el prompt del sistema para mejora de scripts."""
        return """Eres un experto en contenido viral para YouTube Shorts. DEBES responder ÚNICAMENTE con un JSON válido.

ESTRUCTURA JSON REQUERIDA (OBLIGATORIA):
{
  "script_mejorado": "aquí va el texto completo del script mejorado",
  "duracion_estimada": 45,
  "segmentos": [
    {
      "texto": "texto del hook aquí",
      "duracion": 8,
      "tipo": "hook"
    },
    {
      "texto": "texto del contenido aquí",
      "duracion": 30,
      "tipo": "contenido"
    },
    {
      "texto": "texto del CTA aquí",
      "duracion": 7,
      "tipo": "cta"
    }
  ],
  "keywords": ["palabra1", "palabra2", "palabra3"],
  "mejoras": ["Mejora 1", "Mejora 2", "Mejora 3"]
}

REGLAS ESTRICTAS:
1. El script mejorado debe ser completamente funcional y listo para usar
2. Cada segmento debe tener tipo "hook", "contenido" o "cta"
3. La duración total debe coincidir con la suma de segmentos ±3 segundos
4. Hook: 15-25% del tiempo total, debe captar atención inmediata
5. Contenido: 60-70% del tiempo, valor principal del video
6. CTA: 10-25% del tiempo, llamada a la acción clara
7. Keywords deben ser relevantes para SEO de YouTube
8. No uses markdown, solo texto plano en el script"""

    def _create_enhancement_prompt(self, script: Script) -> str:
        """Crea el prompt específico para mejorar el script."""
        categoria_tips = {
            Categoria.TECH: "Enfócate en beneficios prácticos, usa términos técnicos accesibles, incluye datos específicos",
            Categoria.EDUCATION: "Estructura clara paso a paso, ejemplos prácticos, lenguaje educativo pero entretenido",
            Categoria.MARKETING: "CTAs persuasivos, beneficios claros, urgencia sutil, prueba social",
            Categoria.LIFESTYLE: "Experiencias personales, emociones, aspiraciones, relatabilidad",
            Categoria.ENTERTAINMENT: "Elementos sorpresa, humor, narrativa envolvente, momentos memorables"
        }

        tono_instructions = {
            Tono.VIRAL: "Usa lenguaje impactante, hooks provocativos, elementos sorpresa, frases memorables",
            Tono.EDUCATIVO: "Estructura didáctica clara, explicaciones paso a paso, ejemplos concretos",
            Tono.PROFESIONAL: "Lenguaje formal pero accesible, datos y estadísticas, credibilidad",
            Tono.CASUAL: "Conversacional, cercano, como hablar con un amigo, natural y auténtico",
            Tono.ENERGETICO: "Entusiasmo alto, exclamaciones, ritmo rápido, emoción contagiosa"
        }

        return f"""
SCRIPT A MEJORAR: "{script.texto_original}"

ESPECIFICACIONES:
- Duración objetivo: {script.duracion_objetivo} segundos
- Tono: {script.tono.value} - {tono_instructions.get(script.tono, '')}
- Categoría: {script.categoria.value} - {categoria_tips.get(script.categoria, '')}
- Audiencia: {script.audiencia_objetivo}

MEJORA EL SCRIPT siguiendo estas pautas:
1. Mantén el mensaje core pero hazlo más atractivo y viral
2. Optimiza para la duración objetivo ({script.duracion_objetivo}s)
3. Aplica el tono {script.tono.value} de manera consistente
4. Adapta el lenguaje para {script.audiencia_objetivo}
5. Incluye elementos específicos de {script.categoria.value}
6. Estructura en Hook → Contenido → CTA
7. Usa técnicas de retención de audiencia
8. Optimiza para algoritmo de YouTube Shorts

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO."""

    async def enhance_script(self, script: Script) -> Dict[str, Any]:
        """
        Mejora un script usando OpenAI.

        Args:
            script: Script a mejorar

        Returns:
            Dict con script mejorado, segmentos, keywords y mejoras
        """
        try:
            messages = [
                {"role": "system", "content": self._create_system_prompt()},
                {"role": "user", "content": self._create_enhancement_prompt(script)}
            ]

            response = await self.client.complete_chat(
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"}
            )

            # Validar y parsear respuesta JSON
            enhanced_data = self.client.validate_json_response(response)

            # Validar estructura requerida
            self._validate_enhancement_response(enhanced_data)

            logger.info(f"Script mejorado exitosamente. Duración: {enhanced_data.get('duracion_estimada')}s")
            return enhanced_data

        except Exception as e:
            logger.error(f"Error mejorando script: {str(e)}")
            raise

    def _validate_enhancement_response(self, data: Dict[str, Any]) -> None:
        """Valida la estructura de la respuesta de mejora."""
        required_fields = ['script_mejorado', 'duracion_estimada', 'segmentos', 'keywords', 'mejoras']

        for field in required_fields:
            if field not in data:
                raise ValueError(f"Campo requerido '{field}' no encontrado en respuesta")

        # Validar segmentos
        if not isinstance(data['segmentos'], list) or len(data['segmentos']) == 0:
            raise ValueError("Se requiere al menos un segmento")

        for i, segmento in enumerate(data['segmentos']):
            if not isinstance(segmento, dict):
                raise ValueError(f"Segmento {i} debe ser un objeto")

            seg_fields = ['texto', 'duracion', 'tipo']
            for field in seg_fields:
                if field not in segmento:
                    raise ValueError(f"Campo '{field}' requerido en segmento {i}")

            # Validar tipo de segmento
            if segmento['tipo'] not in ['hook', 'contenido', 'cta']:
                raise ValueError(f"Tipo de segmento inválido: {segmento['tipo']}")

    async def generate_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Genera keywords SEO para un texto."""
        try:
            messages = [
                {
                    "role": "system",
                    "content": f"""Genera exactamente {max_keywords} keywords relevantes para SEO de YouTube Shorts.
Responde ÚNICAMENTE con un JSON array de strings: ["keyword1", "keyword2", ...]"""
                },
                {
                    "role": "user",
                    "content": f"Texto: {text}"
                }
            ]

            response = await self.client.complete_chat(
                messages=messages,
                temperature=0.3,
                max_tokens=200
            )

            keywords = json.loads(response.strip())

            if not isinstance(keywords, list):
                raise ValueError("Respuesta debe ser un array")

            return keywords[:max_keywords]

        except Exception as e:
            logger.error(f"Error generando keywords: {str(e)}")
            # Fallback: extraer keywords básicas
            return self._extract_basic_keywords(text, max_keywords)

    def _extract_basic_keywords(self, text: str, max_keywords: int) -> List[str]:
        """Extrae keywords básicas como fallback."""
        import re
        from collections import Counter

        # Limpiar texto y obtener palabras
        words = re.findall(r'\b\w{4,}\b', text.lower())

        # Filtrar stop words básicas
        stop_words = {
            'para', 'que', 'con', 'una', 'por', 'como', 'más', 'pero', 'sus', 'les',
            'muy', 'todo', 'esta', 'son', 'ser', 'estar', 'hacer', 'puede', 'video'
        }

        filtered_words = [w for w in words if w not in stop_words and len(w) > 3]

        # Contar frecuencias y tomar las más comunes
        word_counts = Counter(filtered_words)
        return [word for word, _ in word_counts.most_common(max_keywords)]


class OpenAIAudioService:
    """Servicio para generación de audio usando OpenAI."""

    def __init__(self):
        self.client = OpenAIClient()

    async def generate_speech(
        self,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0
    ) -> bytes:
        """
        Genera audio de texto a voz.

        Args:
            text: Texto a convertir
            voice: Voz a utilizar
            speed: Velocidad del habla (0.25 - 4.0)

        Returns:
            bytes: Datos del audio en formato MP3
        """
        try:
            # Ajustar velocidad en el texto si es necesario
            processed_text = self._process_text_for_speech(text, speed)

            audio_data = await self.client.generate_audio(
                text=processed_text,
                voice=voice,
                model="tts-1-hd",  # Usar modelo HD para mejor calidad
                response_format="mp3"
            )

            logger.info(f"Audio generado: {len(audio_data)} bytes, voz: {voice}")
            return audio_data

        except Exception as e:
            logger.error(f"Error generando speech: {str(e)}")
            raise

    def _process_text_for_speech(self, text: str, speed: float) -> str:
        """Procesa el texto para mejorar la síntesis de voz."""
        # Normalizar espacios
        text = ' '.join(text.split())

        # Añadir pausas en puntos para mejor fluidez
        text = text.replace('.', '... ')
        text = text.replace('!', '! ')
        text = text.replace('?', '? ')

        return text.strip()

    async def transcribe_audio(self, audio_data: bytes) -> str:
        """Transcribe audio a texto."""
        try:
            transcription = await self.client.transcribe_audio(audio_data)
            logger.info(f"Audio transcrito: {len(transcription)} caracteres")
            return transcription

        except Exception as e:
            logger.error(f"Error transcribiendo audio: {str(e)}")
            raise