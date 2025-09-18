import json
import logging
from typing import Dict, Any
from openai import OpenAI
from app.config import settings
from app.models import ScriptResponse, CategoriaEnum, TonoEnum, TipoSegmentoEnum, Segmento

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        if not settings.openai_configured:
            raise ValueError("OpenAI API key no configurada correctamente")

        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _crear_prompt_sistema(self) -> str:
        return """Eres un experto en contenido viral para YouTube Shorts. Tu tarea es mejorar scripts para videos de máximo 60 segundos.

ESTRUCTURA REQUERIDA:
1. HOOK (5-8 segundos): Gancho potente que capture atención inmediata
2. CONTENIDO (40-45 segundos): Información valiosa, clara y concisa
3. CTA (5-8 segundos): Llamada a la acción convincente

OPTIMIZACIONES CLAVE:
- Usar palabras poderosas y emocionales
- Incluir números específicos y datos
- Crear urgencia y curiosidad
- Optimizar para SEO con palabras clave naturales
- Mantener ritmo dinámico
- Usar técnicas de storytelling

CÁLCULO DE DURACIÓN:
- Velocidad promedio: 2 palabras por segundo
- Hook: 10-16 palabras (5-8s)
- Contenido: 80-90 palabras (40-45s)
- CTA: 10-16 palabras (5-8s)

Responde SIEMPRE en formato JSON válido con la estructura exacta especificada."""

    def _crear_prompt_usuario(self, script: str, categoria: CategoriaEnum) -> str:
        prompts_categoria = {
            "tech": "tecnología, programación, innovación, desarrollo, software",
            "marketing": "ventas, estrategia, branding, publicidad, conversión",
            "education": "aprendizaje, conocimiento, enseñanza, tips, tutorial",
            "entertainment": "diversión, entretenimiento, viral, trending, humor",
            "lifestyle": "estilo de vida, bienestar, productividad, hábitos",
            "business": "negocios, emprendimiento, finanzas, éxito, liderazgo",
            "fitness": "ejercicio, salud, entrenamiento, nutrición, bienestar",
            "food": "comida, recetas, cocina, gastronomía, nutrición",
            "travel": "viajes, destinos, aventura, cultura, experiencias",
            "news": "noticias, actualidad, información, análisis, tendencias"
        }

        palabras_clave = prompts_categoria.get(categoria, "contenido, información")

        return f"""Script original: "{script}"
Categoría: {categoria}
Palabras clave relevantes: {palabras_clave}

INSTRUCCIONES ESPECÍFICAS:
1. Mejora el script manteniendo la esencia del mensaje original
2. Crea un hook irresistible que haga imposible no seguir viendo
3. Estructura el contenido de forma lógica y fácil de seguir
4. Incluye un CTA que genere engagement (like, follow, comment)
5. Optimiza la duración total entre 15-60 segundos
6. Identifica el tono más efectivo para la audiencia

Responde con este JSON exacto:
{
  "script_mejorado": "texto completo del script mejorado",
  "duracion_estimada": número_total_segundos,
  "segmentos": [
    {"texto": "hook_text", "duracion": segundos, "tipo": "hook"},
    {"texto": "contenido_text", "duracion": segundos, "tipo": "contenido"},
    {"texto": "cta_text", "duracion": segundos, "tipo": "cta"}
  ],
  "palabras_clave": ["palabra1", "palabra2", "palabra3"],
  "tono": "educativo|viral|profesional|casual|energetico",
  "mejoras_aplicadas": ["mejora1", "mejora2", "mejora3"]
}"""

    async def mejorar_script(self, script: str, categoria: CategoriaEnum) -> ScriptResponse:
        try:
            logger.info(f"Mejorando script de categoría {categoria}")

            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": self._crear_prompt_sistema()},
                    {"role": "user", "content": self._crear_prompt_usuario(script, categoria)}
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            logger.info(f"Respuesta de OpenAI recibida: {len(content)} caracteres")

            # Parse JSON response
            try:
                data = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON: {e}")
                raise ValueError("Respuesta inválida de OpenAI")

            # Validar y crear segmentos
            segmentos = []
            for seg_data in data.get("segmentos", []):
                segmento = Segmento(
                    texto=seg_data["texto"],
                    duracion=seg_data["duracion"],
                    tipo=TipoSegmentoEnum(seg_data["tipo"])
                )
                segmentos.append(segmento)

            # Validar tono
            tono = TonoEnum(data.get("tono", "educativo"))

            # Crear respuesta validada
            response_data = ScriptResponse(
                script_mejorado=data["script_mejorado"],
                duracion_estimada=data["duracion_estimada"],
                segmentos=segmentos,
                palabras_clave=data.get("palabras_clave", []),
                tono=tono,
                mejoras_aplicadas=data.get("mejoras_aplicadas", [])
            )

            logger.info(f"Script mejorado exitosamente. Duración: {response_data.duracion_estimada}s")
            return response_data

        except Exception as e:
            logger.error(f"Error en OpenAI service: {str(e)}")
            if "rate_limit" in str(e).lower():
                raise ValueError("Límite de rate de OpenAI excedido. Intenta nuevamente en unos minutos.")
            elif "api_key" in str(e).lower():
                raise ValueError("API key de OpenAI inválida")
            else:
                raise ValueError(f"Error procesando el script: {str(e)}")


# Instancia singleton del servicio
openai_service = OpenAIService() if settings.openai_configured else None