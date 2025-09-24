"""
Use case for generating audio from scripts
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from app.domain.repositories.script_repository import ScriptRepository
from app.domain.repositories.user_repository import UserRepository
from app.application.interfaces.audio_service import AudioService
from app.application.interfaces.storage_service import StorageService

logger = logging.getLogger(__name__)


class GenerateAudioUseCase:
    """
    Caso de uso para generar audio a partir de scripts.
    """

    def __init__(
        self,
        script_repository: ScriptRepository,
        user_repository: UserRepository,
        audio_service: AudioService,
        storage_service: StorageService
    ):
        self.script_repository = script_repository
        self.user_repository = user_repository
        self.audio_service = audio_service
        self.storage_service = storage_service

    async def execute(
        self,
        user_id: str,
        script_id: str,
        voice: str = "alloy",
        speed: float = 1.0,
        save_to_storage: bool = True
    ) -> Dict[str, Any]:
        """
        Genera audio a partir de un script.

        Args:
            user_id: ID del usuario
            script_id: ID del script
            voice: Voz a utilizar
            speed: Velocidad del habla
            save_to_storage: Si guardar el audio en storage

        Returns:
            Dict con información del audio generado

        Raises:
            ValueError: Si los parámetros son inválidos
            PermissionError: Si el usuario no tiene permisos
        """
        # Validar usuario
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")

        # Obtener script
        script = await self.script_repository.get_by_id(script_id)
        if not script:
            raise ValueError("Script no encontrado")

        # Verificar permisos
        if script.user_id != user_id:
            raise PermissionError(
                "No tienes permisos para generar audio de este script")

        # Validar que el script tenga texto mejorado
        text_to_convert = script.enhanced_text or script.original_text
        if not text_to_convert:
            raise ValueError(
                "El script no tiene contenido para convertir a audio")

        # Validar parámetros
        self._validate_parameters(voice, speed)

        try:
            logger.info(
                f"Generando audio para script: {script_id}, voz: {voice}")

            # Generar audio
            audio_data = await self.audio_service.generate_speech(
                text=text_to_convert,
                voice=voice,
                speed=speed
            )

            # Calcular duración estimada (aproximada)
            estimated_duration = self._estimate_audio_duration(
                text_to_convert, speed)

            result = {
                "script_id": script_id,
                "voice": voice,
                "speed": speed,
                "text_length": len(text_to_convert),
                "estimated_duration": estimated_duration,
                "audio_size": len(audio_data),
                "generated_at": datetime.utcnow().isoformat()
            }

            # Guardar en storage si se solicita
            if save_to_storage:
                audio_url = await self._save_audio_to_storage(
                    user_id, script_id, audio_data, voice
                )
                result["audio_url"] = audio_url
                result["stored"] = True

                logger.info(f"Audio guardado en storage: {audio_url}")
            else:
                # Retornar audio como base64 si no se guarda
                import base64
                result["audio_base64"] = base64.b64encode(
                    audio_data).decode('utf-8')
                result["stored"] = False

            # Actualizar actividad del usuario
            await self.user_repository.update_last_activity(user_id, datetime.utcnow())

            logger.info(
                f"Audio generado exitosamente para script: {script_id}")
            return result

        except Exception as e:
            logger.error(f"Error generando audio: {str(e)}")
            raise

    async def generate_audio_from_text(
        self,
        user_id: str,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0,
        save_to_storage: bool = False
    ) -> Dict[str, Any]:
        """
        Genera audio directamente desde texto (sin script guardado).

        Args:
            user_id: ID del usuario
            text: Texto a convertir
            voice: Voz a utilizar
            speed: Velocidad del habla
            save_to_storage: Si guardar el audio en storage

        Returns:
            Dict con información del audio generado
        """
        # Validar usuario
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")

        # Validar texto
        if not text or not text.strip():
            raise ValueError("El texto no puede estar vacío")

        if len(text.strip()) > 3000:
            raise ValueError(
                "El texto es demasiado largo (máximo 3000 caracteres)")

        # Validar parámetros
        self._validate_parameters(voice, speed)

        try:
            logger.info(f"Generando audio desde texto para usuario: {user_id}")

            # Generar audio
            audio_data = await self.audio_service.generate_speech(
                text=text.strip(),
                voice=voice,
                speed=speed
            )

            estimated_duration = self._estimate_audio_duration(text, speed)

            result = {
                "text_length": len(text),
                "voice": voice,
                "speed": speed,
                "estimated_duration": estimated_duration,
                "audio_size": len(audio_data),
                "generated_at": datetime.utcnow().isoformat()
            }

            if save_to_storage:
                # Generar ID único para el archivo
                temp_id = str(uuid.uuid4())
                audio_url = await self._save_audio_to_storage(
                    user_id, temp_id, audio_data, voice, prefix="text_audio"
                )
                result["audio_url"] = audio_url
                result["stored"] = True
            else:
                import base64
                result["audio_base64"] = base64.b64encode(
                    audio_data).decode('utf-8')
                result["stored"] = False

            # Actualizar actividad del usuario
            await self.user_repository.update_last_activity(user_id, datetime.utcnow())

            return result

        except Exception as e:
            logger.error(f"Error generando audio desde texto: {str(e)}")
            raise

    async def transcribe_audio(
        self,
        user_id: str,
        audio_data: bytes
    ) -> Dict[str, Any]:
        """
        Transcribe audio a texto.

        Args:
            user_id: ID del usuario
            audio_data: Datos del audio

        Returns:
            Dict con el texto transcrito
        """
        # Validar usuario
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")

        # Validar audio
        if not audio_data:
            raise ValueError("Los datos de audio están vacíos")

        if len(audio_data) > 25 * 1024 * 1024:  # 25MB máximo
            raise ValueError(
                "El archivo de audio es demasiado grande (máximo 25MB)")

        try:
            logger.info(f"Transcribiendo audio para usuario: {user_id}")

            # Transcribir audio
            transcription = await self.audio_service.transcribe_audio(audio_data)

            # Actualizar actividad del usuario
            await self.user_repository.update_last_activity(user_id, datetime.utcnow())

            return {
                "transcription": transcription,
                "character_count": len(transcription),
                "word_count": len(transcription.split()),
                "audio_size": len(audio_data),
                "transcribed_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error transcribiendo audio: {str(e)}")
            raise

    def _validate_parameters(self, voice: str, speed: float) -> None:
        """Valida los parámetros de generación de audio."""
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        if voice not in valid_voices:
            raise ValueError(f"Voz inválida. Opciones válidas: {valid_voices}")

        if not 0.25 <= speed <= 4.0:
            raise ValueError("La velocidad debe estar entre 0.25 y 4.0")

    def _estimate_audio_duration(self, text: str, speed: float) -> float:
        """Estima la duración del audio basada en el texto y velocidad."""
        # Estimación: ~2 palabras por segundo a velocidad normal
        words = len(text.split())
        base_duration = words / 2.0  # segundos
        adjusted_duration = base_duration / speed
        return round(adjusted_duration, 1)

    async def _save_audio_to_storage(
        self,
        user_id: str,
        content_id: str,
        audio_data: bytes,
        voice: str,
        prefix: str = "script_audio"
    ) -> str:
        """Guarda el audio en el storage y retorna la URL."""
        # Crear ruta del archivo
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_path = f"audio/{user_id}/{prefix}_{content_id}_{voice}_{timestamp}.mp3"

        # Subir a storage
        audio_url = await self.storage_service.upload_file(
            bucket="generated-content",
            file_path=file_path,
            file_data=audio_data,
            content_type="audio/mpeg"
        )

        if not audio_url:
            raise RuntimeError("Error guardando audio en storage")

        return audio_url

    async def delete_audio(self, user_id: str, audio_url: str) -> bool:
        """
        Elimina un audio del storage.

        Args:
            user_id: ID del usuario
            audio_url: URL del audio a eliminar

        Returns:
            True si se eliminó exitosamente
        """
        try:
            # Extraer la ruta del archivo desde la URL
            # Esto depende del formato de URL del storage
            if "/audio/" in audio_url:
                file_path = audio_url.split("/audio/")[-1]
                file_path = "audio/" + file_path

                # Verificar que el archivo pertenece al usuario
                if not file_path.startswith(f"audio/{user_id}/"):
                    raise PermissionError(
                        "No tienes permisos para eliminar este audio")

                success = await self.storage_service.delete_file(
                    bucket="generated-content",
                    file_path=file_path
                )

                return success

            return False

        except Exception as e:
            logger.error(f"Error eliminando audio: {str(e)}")
            return False
