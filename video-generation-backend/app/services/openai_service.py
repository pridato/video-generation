import json
import logging
from openai import OpenAI
from app.config import settings
from app.models import ScriptResponse, CategoriaEnum, TonoEnum, TipoSegmentoEnum, Segmento
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        if not settings.openai_configured:
            raise ValueError("OpenAI API key no configurada correctamente")

        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _crear_prompt_sistema(self) -> str:
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
            "texto": "texto del contenido principal aquí",
            "duracion": 32,
            "tipo": "contenido"
            },
            {
            "texto": "texto de la llamada a la acción aquí",
            "duracion": 5,
            "tipo": "cta"
            }
        ],
        "palabras_clave": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
        "tono": "educativo",
        "mejoras_aplicadas": ["mejora 1", "mejora 2", "mejora 3"]
        }

        REGLAS ESTRICTAS:
        - SOLO responde con el JSON, sin texto adicional
        - Los tipos de segmento DEBEN ser: "hook", "contenido", "cta"
        - Duración entre 15-60 segundos total
        - Exactamente 3 segmentos
        - Al menos 3 palabras clave
        - Tono debe ser uno de: "educativo", "viral", "profesional", "casual", "energetico"
        - Script mejorado debe combinar los 3 segmentos

        OPTIMIZACIONES:
        - Hook: Captura atención inmediata (5-8s)
        - Contenido: Información valiosa y clara (30-45s)  
        - CTA: Llamada a la acción específica (5-8s)
        - Usar emojis, números, palabras poderosas
        - Crear urgencia y curiosidad"""

    def _crear_prompt_usuario(self, script: str, categoria: CategoriaEnum) -> str:
        """
        Prompt específico para cada solicitud de mejora de script.
        Incluye el script original y la categoría para contexto.
        Params:
            script: Script original a mejorar
            categoria: Categoría del contenido para adaptar el tono y estilo
        Returns:
            Prompt completo para el usuario
        """
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

        palabras_clave = prompts_categoria.get(
            categoria, "contenido, información")

        prompt = f"""Script original: "{script}"
        Categoría: {categoria}
            Palabras clave relevantes: {palabras_clave}

            INSTRUCCIONES ESPECÍFICAS:
            1. Mejora el script manteniendo la esencia del mensaje original
            2. Crea un hook irresistible que haga imposible no seguir viendo
            3. Estructura el contenido de forma lógica y fácil de seguir
            4. Incluye un CTA que genere engagement (like, follow, comment)
            5. Optimiza la duración total entre 15-60 segundos
            6. Identifica el tono más efectivo para la audiencia

            Responde con el JSON exacto especificado en las instrucciones del sistema."""

        return prompt

    async def mejorar_script(self, script: str, categoria: CategoriaEnum) -> ScriptResponse:
        try:
            logger.info(f"Mejorando script de categoría {categoria}")

            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": self._crear_prompt_sistema()},
                    {"role": "user", "content": self._crear_prompt_usuario(
                        script, categoria)}
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content or ""
            logger.info(
                f"Respuesta de OpenAI recibida: {content}")

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

            # Generar embedding del script mejorado
            script_embedding = None
            if embedding_service:
                try:
                    # Preparar texto enriquecido para embedding
                    prepared_text = embedding_service.prepare_script_text(
                        script=data["script_mejorado"],
                        categoria=categoria.value,
                        keywords=data.get("palabras_clave", [])
                    )

                    # Generar embedding usando all-mpnet-base-v2
                    script_embedding = embedding_service.generate_script_embedding(
                        prepared_text)
                    logger.info(
                        f"✅ Embedding generado exitosamente ({len(script_embedding)} dimensiones)")

                except Exception as e:
                    logger.warning(f"⚠️ No se pudo generar embedding: {e}")
                    # Continuar sin embedding, no es crítico para la funcionalidad principal
            else:
                logger.warning("⚠️ Servicio de embeddings no disponible")

            # Crear respuesta validada
            response_data = ScriptResponse(
                script_mejorado=data["script_mejorado"],
                duracion_estimada=data["duracion_estimada"],
                segmentos=segmentos,
                palabras_clave=data.get("palabras_clave", []),
                tono=tono,
                mejoras_aplicadas=data.get("mejoras_aplicadas", []),
                embedding=script_embedding
            )

            logger.info(
                f"Script mejorado exitosamente. Duración: {response_data.duracion_estimada}s")
            return response_data

        except Exception as e:
            logger.error(f"Error en OpenAI service: {str(e)}")
            if "rate_limit" in str(e).lower():
                raise ValueError(
                    "Límite de rate de OpenAI excedido. Intenta nuevamente en unos minutos.")
            elif "api_key" in str(e).lower():
                raise ValueError("API key de OpenAI inválida")
            else:
                raise ValueError(f"Error procesando el script: {str(e)}")

    async def generar_tts(self, script: str, voice_id: str) -> bytes:
        """
        Genera audio MP3 desde un script con la voz indicada.
        La validación de voice_id la hace el frontend, aquí solo pasamos el valor a OpenAI.
        """
        response = self.client.audio.speech.create(
            model="gpt-4o-mini-tts",  # Modelo correcto de TTS
            voice=voice_id,  # type: ignore
            input=script,
        )

        return response.read()


# Instancia singleton del servicio
openai_service = OpenAIService() if settings.openai_configured else None
