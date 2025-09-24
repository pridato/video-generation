"""
OpenAI client adapter for the infrastructure layer
"""
import json
import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIClient:
    """Cliente adaptador para la API de OpenAI."""

    def __init__(self):
        """Inicializa el cliente de OpenAI."""
        if not settings.openai_configured:
            raise ValueError("OpenAI API key no configurada correctamente")

        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def complete_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = None,
        max_tokens: int = None,
        response_format: Dict[str, Any] = None
    ) -> str:
        """
        Realiza una completion de chat con OpenAI.

        Args:
            messages: Lista de mensajes del chat
            model: Modelo a utilizar (por defecto settings.OPENAI_MODEL)
            temperature: Temperatura para la generación (por defecto settings.TEMPERATURE)
            max_tokens: Máximo número de tokens (por defecto settings.MAX_TOKENS)
            response_format: Formato de respuesta esperado

        Returns:
            str: Respuesta del modelo
        """
        try:
            params = {
                "model": model or settings.OPENAI_MODEL,
                "messages": messages,
                "temperature": temperature or settings.TEMPERATURE,
                "max_tokens": max_tokens or settings.MAX_TOKENS
            }

            if response_format:
                params["response_format"] = response_format

            logger.info(f"Enviando request a OpenAI: {params['model']}")

            response = self.client.chat.completions.create(**params)

            content = response.choices[0].message.content
            logger.info("Response recibida de OpenAI exitosamente")

            return content

        except Exception as e:
            logger.error(f"Error en OpenAI API: {str(e)}")
            raise

    async def generate_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """
        Genera embeddings para un texto.

        Args:
            text: Texto para generar embedding
            model: Modelo de embedding a usar

        Returns:
            List[float]: Vector de embedding
        """
        try:
            logger.info("Generando embedding con OpenAI")

            response = self.client.embeddings.create(
                model=model,
                input=text
            )

            embedding = response.data[0].embedding
            logger.info(f"Embedding generado: {len(embedding)} dimensiones")

            return embedding

        except Exception as e:
            logger.error(f"Error generando embedding: {str(e)}")
            raise

    async def generate_audio(
        self,
        text: str,
        voice: str = "alloy",
        model: str = "tts-1",
        response_format: str = "mp3"
    ) -> bytes:
        """
        Genera audio a partir de texto usando Text-to-Speech.

        Args:
            text: Texto a convertir en audio
            voice: Voz a utilizar
            model: Modelo TTS a usar
            response_format: Formato de audio de salida

        Returns:
            bytes: Datos del archivo de audio
        """
        try:
            logger.info(f"Generando audio TTS con voz: {voice}")

            response = self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                response_format=response_format
            )

            audio_data = b""
            for chunk in response.iter_bytes():
                audio_data += chunk

            logger.info(f"Audio generado: {len(audio_data)} bytes")
            return audio_data

        except Exception as e:
            logger.error(f"Error generando audio: {str(e)}")
            raise

    async def transcribe_audio(self, audio_data: bytes, filename: str = "audio.mp3") -> str:
        """
        Transcribe audio a texto usando Whisper.

        Args:
            audio_data: Datos del archivo de audio
            filename: Nombre del archivo para el contexto

        Returns:
            str: Texto transcrito
        """
        try:
            logger.info("Transcribiendo audio con Whisper")

            # Crear un objeto file-like desde bytes
            from io import BytesIO
            audio_file = BytesIO(audio_data)
            audio_file.name = filename

            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )

            transcription = response.text
            logger.info(f"Transcripción completada: {len(transcription)} caracteres")

            return transcription

        except Exception as e:
            logger.error(f"Error transcribiendo audio: {str(e)}")
            raise

    def validate_json_response(self, response: str) -> Dict[str, Any]:
        """
        Valida y parsea una respuesta JSON de OpenAI.

        Args:
            response: Respuesta en texto de OpenAI

        Returns:
            Dict[str, Any]: Respuesta parseada como diccionario

        Raises:
            ValueError: Si la respuesta no es JSON válido
        """
        try:
            # Limpiar la respuesta si tiene marcadores de código
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]

            # Parsear JSON
            parsed_response = json.loads(cleaned_response.strip())
            return parsed_response

        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON de OpenAI: {str(e)}")
            logger.error(f"Respuesta recibida: {response[:500]}...")
            raise ValueError(f"Respuesta inválida de OpenAI: {str(e)}")

    async def health_check(self) -> bool:
        """
        Verifica la conectividad con OpenAI.

        Returns:
            bool: True si la conexión es exitosa
        """
        try:
            response = await self.complete_chat(
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5,
                temperature=0
            )
            return bool(response)

        except Exception as e:
            logger.error(f"Health check falló: {str(e)}")
            return False