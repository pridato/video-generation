"""
Video domain service - Contains complex business logic for videos
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..entities.video import Video, VideoStatus, SelectedClip, VideoQuality
from ..entities.user import User


class VideoDomainService:
    """Servicio de dominio para lógica compleja de videos."""

    @staticmethod
    def puede_generar_video(usuario: User, duracion_solicitada: int) -> tuple[bool, Optional[str]]:
        """Verifica si un usuario puede generar un video con la duración solicitada."""
        if not usuario.can_generate_video():
            limite = usuario.limits.videos_per_month
            actual = usuario.videos_generated_current_month
            return False, f"Has alcanzado tu límite mensual de videos ({actual}/{limite})"

        if not usuario.can_use_duration(duracion_solicitada):
            limite = usuario.limits.max_video_duration
            return False, f"La duración solicitada ({duracion_solicitada}s) excede tu límite ({limite}s)"

        return True, None

    @staticmethod
    def calcular_tiempo_estimado_procesamiento(video: Video) -> int:
        """Calcula el tiempo estimado de procesamiento en segundos."""
        base_time = 30  # tiempo base en segundos

        # Factor por duración objetivo
        duration_factor = video.target_duration / 30  # 30s como referencia

        # Factor por número de clips
        clips_factor = len(video.selected_clips) * 2  # 2s por clip

        # Factor por calidad
        quality_factors = {
            VideoQuality.SD: 1.0,
            VideoQuality.HD: 1.5,
            VideoQuality.FHD: 2.0
        }
        quality_factor = quality_factors.get(video.quality, 1.0)

        # Factor por template (si es premium, puede ser más complejo)
        template_factor = 1.3 if video.template.is_premium else 1.0

        tiempo_estimado = int(
            base_time * duration_factor * quality_factor * template_factor + clips_factor
        )

        return max(tiempo_estimado, 15)  # mínimo 15 segundos

    @staticmethod
    def optimizar_seleccion_clips(clips: List[SelectedClip], duracion_objetivo: int) -> List[SelectedClip]:
        """Optimiza la selección de clips para ajustarse a la duración objetivo."""
        if not clips:
            return clips

        # Ordenar clips por relevancia
        clips_ordenados = sorted(
            clips, key=lambda c: c.relevance_score, reverse=True)

        clips_optimizados = []
        duracion_acumulada = 0.0

        for clip in clips_ordenados:
            duracion_clip = clip.latest_position - clip.initial_position

            # Si añadir este clip no excede la duración objetivo
            if duracion_acumulada + duracion_clip <= duracion_objetivo:
                clips_optimizados.append(clip)
                duracion_acumulada += duracion_clip
            elif duracion_acumulada < duracion_objetivo:
                # Ajustar la duración del último clip para completar exactamente
                duracion_restante = duracion_objetivo - duracion_acumulada
                clip_ajustado = SelectedClip(
                    id=clip.id,
                    url=clip.url,
                    duration=duracion_restante,
                    initial_position=clip.initial_position,
                    latest_position=clip.initial_position + duracion_restante,
                    relevance_score=clip.relevance_score,
                    metadata=clip.metadata
                )
                clips_optimizados.append(clip_ajustado)
                break

        return clips_optimizados

    @staticmethod
    def validar_configuracion_video(video: Video) -> Dict[str, Any]:
        """Valida la configuración del video antes del procesamiento."""
        validaciones = {
            'clips_suficientes': False,
            'duracion_clips_adecuada': False,
            'calidad_clips_adecuada': False,
            'audio_config_valido': False,
            'template_valido': False,
            'es_procesable': False,
            'errores': []
        }

        # Validar clips
        if len(video.selected_clips) == 0:
            validaciones['errores'].append("No hay clips seleccionados")
        else:
            validaciones['clips_suficientes'] = len(
                video.selected_clips) >= 3

        # Validar duración de clips
        duracion_total = video.total_duration_clips
        if duracion_total < video.target_duration * 0.8:
            validaciones['errores'].append(
                "Los clips son muy cortos para la duración objetivo")
        elif duracion_total > video.target_duration * 1.5:
            validaciones['errores'].append(
                "Los clips son muy largos para la duración objetivo")
        else:
            validaciones['duracion_clips_adecuada'] = True

        # Validar calidad promedio de clips
        if video.selected_clips:
            relevancia_promedio = sum(
                c.relevance_score for c in video.selected_clips) / len(video.selected_clips)
            validaciones['calidad_clips_adecuada'] = relevancia_promedio >= 0.5

        # Validar configuración de audio
        audio_valido = (
            video.audio_config.voice is not None and
            0.5 <= video.audio_config.speed <= 2.0 and
            0.0 <= video.audio_config.volume <= 1.0
        )
        validaciones['audio_config_valido'] = audio_valido
        if not audio_valido:
            validaciones['errores'].append("Configuración de audio inválida")

        # Validar template
        validaciones['template_valido'] = bool(
            video.template.id and video.template.name)
        if not validaciones['template_valido']:
            validaciones['errores'].append("Template inválido")

        # Determinar si es procesable
        validaciones['es_procesable'] = (
            len(validaciones['errores']) == 0 and
            validaciones['clips_suficientes'] and
            validaciones['duracion_clips_adecuada'] and
            validaciones['audio_config_valido'] and
            validaciones['template_valido']
        )

        return validaciones

    @staticmethod
    def calcular_estadisticas_procesamiento(videos: List[Video], dias: int = 30) -> Dict[str, Any]:
        """Calcula estadísticas de procesamiento de videos."""
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        videos_periodo = [v for v in videos if v.created_at >= fecha_limite]

        if not videos_periodo:
            return {
                'total_videos': 0,
                'videos_completados': 0,
                'videos_fallidos': 0,
                'tasa_exito': 0.0,
                'tiempo_promedio_procesamiento': 0.0,
                'duracion_promedio_videos': 0.0
            }

        completados = [v for v in videos_periodo if v.state ==
                       VideoStatus.COMPLETED]
        fallidos = [v for v in videos_periodo if v.state ==
                    VideoStatus.FAILED]

        # Calcular tiempo promedio de procesamiento
        tiempos_procesamiento = []
        for video in completados:
            if video.processed_at:
                tiempo = (video.processed_at -
                          video.created_at).total_seconds()
                tiempos_procesamiento.append(tiempo)

        tiempo_promedio = sum(tiempos_procesamiento) / \
            len(tiempos_procesamiento) if tiempos_procesamiento else 0

        # Calcular duración promedio de videos completados
        duraciones = [
            v.final_duration for v in completados if v.final_duration]
        duracion_promedio = sum(duraciones) / \
            len(duraciones) if duraciones else 0

        return {
            'total_videos': len(videos_periodo),
            'videos_completados': len(completados),
            'videos_fallidos': len(fallidos),
            'tasa_exito': len(completados) / len(videos_periodo) * 100 if videos_periodo else 0,
            'tiempo_promedio_procesamiento': tiempo_promedio,
            'duracion_promedio_videos': duracion_promedio,
            'dias_analizados': dias
        }

    @staticmethod
    def generar_metadatos_video(video: Video, script_keywords: List[str] = []) -> Dict[str, Any]:
        """Genera metadatos enriquecidos para el video."""
        metadatos = {
            'version': '1.0',
            'created_at': video.created_at.isoformat(),
            'duracion_objetivo': video.target_duration,
            'numero_clips': len(video.selected_clips),
            'template_usado': video.template.name,
            'calidad': video.quality.value,
            'config_audio': {
                'voz': video.audio_config.voice.value,
                'velocidad': video.audio_config.speed,
                'volumen': video.audio_config.volume
            },
            'clips_info': [
                {
                    'id': clip.id,
                    'duracion': clip.latest_position - clip.initial_position,
                    'relevancia': clip.relevance_score
                }
                for clip in video.selected_clips
            ]
        }

        if script_keywords:
            metadatos['keywords'] = script_keywords

        if video.final_duration:
            metadatos['duracion_final'] = video.final_duration
            metadatos['diferencia_duracion'] = abs(
                video.final_duration - video.target_duration)

        return metadatos

    @staticmethod
    def recomendar_optimizaciones(video: Video) -> List[str]:
        """Recomienda optimizaciones para el video."""
        recomendaciones = []
        validacion = VideoDomainService.validar_configuracion_video(video)

        if not validacion['clips_suficientes']:
            recomendaciones.append(
                "Añade más clips para mejorar la variedad visual")

        if not validacion['duracion_clips_adecuada']:
            duracion_total = video.total_duration_clips
            if duracion_total < video.target_duration:
                recomendaciones.append(
                    "Los clips son muy cortos, considera clips más largos")
            else:
                recomendaciones.append(
                    "Los clips son muy largos, considera clips más cortos")

        if not validacion['calidad_clips_adecuada']:
            recomendaciones.append(
                "Mejora la selección de clips eligiendo contenido más relevante")

        # Recomendaciones por calidad
        if video.quality == VideoQuality.SD:
            recomendaciones.append(
                "Considera usar HD para mejor calidad visual")

        # Recomendaciones por audio
        if video.audio_config.speed > 1.5:
            recomendaciones.append(
                "La velocidad de voz es alta, considera reducirla para mejor comprensión")

        return recomendaciones
