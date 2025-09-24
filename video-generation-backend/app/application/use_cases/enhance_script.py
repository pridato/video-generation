"""
Use case for enhancing scripts with AI
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from app.domain.entities.script import Script, SegmentoScript, Tono, Categoria, TipoSegmento
from app.domain.entities.user import Usuario
from app.domain.repositories.script_repository import ScriptRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.services.script_domain_service import ScriptDomainService
from app.application.interfaces.ai_service import AIService

logger = logging.getLogger(__name__)


class EnhanceScriptUseCase:
    """Caso de uso para mejorar scripts con IA."""

    def __init__(
        self,
        script_repository: ScriptRepository,
        user_repository: UserRepository,
        ai_service: AIService
    ):
        self.script_repository = script_repository
        self.user_repository = user_repository
        self.ai_service = ai_service

    async def execute(
        self,
        user_id: str,
        original_script: str,
        target_duration: int,
        tone: str,
        category: str,
        target_audience: str = "general"
    ) -> Dict[str, Any]:
        """
        Ejecuta el caso de uso de mejora de script.

        Args:
            user_id: ID del usuario
            original_script: Texto original del script
            target_duration: Duración objetivo en segundos
            tone: Tono deseado
            category: Categoría del contenido
            target_audience: Audiencia objetivo

        Returns:
            Dict con el script mejorado y metadatos

        Raises:
            ValueError: Si los parámetros son inválidos
            PermissionError: Si el usuario no puede generar scripts
        """
        # Validar usuario
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")

        # Validar límites del usuario (esto podría expandirse)
        if not user.puede_generar_video():
            raise PermissionError("Usuario ha alcanzado su límite mensual")

        # Validar parámetros
        self._validate_parameters(original_script, target_duration, tone, category)

        try:
            # Crear entidad Script
            script_id = str(uuid.uuid4())
            script = Script(
                id=script_id,
                texto_original=original_script.strip(),
                texto_mejorado=None,
                duracion_objetivo=target_duration,
                tono=Tono(tone),
                audiencia_objetivo=target_audience,
                categoria=Categoria(category),
                segmentos=[],
                palabras_clave=[],
                mejoras_aplicadas=[],
                embedding=None,
                usuario_id=user_id,
                created_at=datetime.utcnow()
            )

            logger.info(f"Iniciando mejora de script para usuario: {user_id}")

            # Mejorar script con IA
            enhancement_result = await self.ai_service.enhance_script(
                original_text=original_script,
                target_duration=target_duration,
                tone=tone,
                category=category,
                target_audience=target_audience
            )

            # Procesar resultado de la mejora
            script.texto_mejorado = enhancement_result.get('script_mejorado', '')
            script.palabras_clave = enhancement_result.get('keywords', [])
            script.mejoras_aplicadas = enhancement_result.get('mejoras', [])

            # Crear segmentos
            segmentos_data = enhancement_result.get('segmentos', [])
            for i, seg_data in enumerate(segmentos_data):
                segmento = SegmentoScript(
                    texto=seg_data.get('texto', ''),
                    duracion=seg_data.get('duracion', 0),
                    tipo=TipoSegmento(seg_data.get('tipo', 'contenido')),
                    posicion=i
                )
                script.segmentos.append(segmento)

            # Si no hay segmentos, generarlos automáticamente
            if not script.segmentos:
                script.segmentos = ScriptDomainService.generar_segmentos_automaticos(script)

            # Generar embedding
            try:
                script.embedding = await self.ai_service.generate_embedding(script.texto_mejorado)
            except Exception as e:
                logger.warning(f"No se pudo generar embedding: {str(e)}")

            # Guardar script en repositorio
            saved_script = await self.script_repository.create(script)

            # Actualizar actividad del usuario
            await self.user_repository.update_last_activity(user_id, datetime.utcnow())

            logger.info(f"Script mejorado exitosamente: {script_id}")

            # Generar métricas de calidad
            quality_metrics = ScriptDomainService.validar_calidad_script(saved_script)

            return {
                "script_id": saved_script.id,
                "original_script": saved_script.texto_original,
                "enhanced_script": saved_script.texto_mejorado,
                "original_length": saved_script.longitud_original,
                "enhanced_length": saved_script.longitud_mejorada,
                "estimated_duration": saved_script.duracion_estimada,
                "target_duration": saved_script.duracion_objetivo,
                "segments": [
                    {
                        "text": seg.texto,
                        "duration": seg.duracion,
                        "type": seg.tipo.value,
                        "position": seg.posicion
                    }
                    for seg in saved_script.segmentos
                ],
                "keywords": saved_script.palabras_clave,
                "tone": saved_script.tono.value,
                "category": saved_script.categoria.value,
                "improvements": saved_script.mejoras_aplicadas,
                "quality_score": quality_metrics.get('score_calidad', 0),
                "suggestions": ScriptDomainService.sugerir_mejoras(saved_script),
                "created_at": saved_script.created_at.isoformat(),
                "embedding_generated": saved_script.embedding is not None
            }

        except Exception as e:
            logger.error(f"Error mejorando script: {str(e)}")
            raise

    def _validate_parameters(
        self,
        script: str,
        target_duration: int,
        tone: str,
        category: str
    ) -> None:
        """Valida los parámetros de entrada."""
        if not script or not script.strip():
            raise ValueError("El script no puede estar vacío")

        if len(script.strip()) < 10:
            raise ValueError("El script debe tener al menos 10 caracteres")

        if len(script.strip()) > 2000:
            raise ValueError("El script no puede exceder 2000 caracteres")

        if not 15 <= target_duration <= 120:
            raise ValueError("La duración debe estar entre 15 y 120 segundos")

        try:
            Tono(tone)
        except ValueError:
            valid_tones = [t.value for t in Tono]
            raise ValueError(f"Tono inválido. Opciones válidas: {valid_tones}")

        try:
            Categoria(category)
        except ValueError:
            valid_categories = [c.value for c in Categoria]
            raise ValueError(f"Categoría inválida. Opciones válidas: {valid_categories}")

    async def get_user_scripts(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene los scripts de un usuario."""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")

        scripts = await self.script_repository.get_by_user_id(user_id, limit, offset)
        total_count = await self.script_repository.count({"usuario_id": user_id})

        return {
            "scripts": [
                {
                    "id": script.id,
                    "original_script": script.texto_original,
                    "enhanced_script": script.texto_mejorado,
                    "duration": script.duracion_estimada,
                    "target_duration": script.duracion_objetivo,
                    "tone": script.tono.value,
                    "category": script.categoria.value,
                    "keywords": script.palabras_clave,
                    "created_at": script.created_at.isoformat(),
                    "quality_score": ScriptDomainService.validar_calidad_script(script).get('score_calidad', 0)
                }
                for script in scripts
            ],
            "total_count": total_count,
            "has_more": offset + limit < total_count
        }

    async def get_script_by_id(self, script_id: str, user_id: str) -> Dict[str, Any]:
        """Obtiene un script específico por ID."""
        script = await self.script_repository.get_by_id(script_id)
        if not script:
            raise ValueError("Script no encontrado")

        if script.usuario_id != user_id:
            raise PermissionError("No tienes permisos para ver este script")

        quality_metrics = ScriptDomainService.validar_calidad_script(script)

        return {
            "script_id": script.id,
            "original_script": script.texto_original,
            "enhanced_script": script.texto_mejorado,
            "original_length": script.longitud_original,
            "enhanced_length": script.longitud_mejorada,
            "estimated_duration": script.duracion_estimada,
            "target_duration": script.duracion_objetivo,
            "segments": [
                {
                    "text": seg.texto,
                    "duration": seg.duracion,
                    "type": seg.tipo.value,
                    "position": seg.posicion
                }
                for seg in script.segmentos
            ],
            "keywords": script.palabras_clave,
            "tone": script.tono.value,
            "category": script.categoria.value,
            "target_audience": script.audiencia_objetivo,
            "improvements": script.mejoras_aplicadas,
            "quality_metrics": quality_metrics,
            "suggestions": ScriptDomainService.sugerir_mejoras(script),
            "created_at": script.created_at.isoformat(),
            "updated_at": script.updated_at.isoformat() if script.updated_at else None
        }