"""
Video domain service - Contains complex business logic for videos
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..entities.video import Video, EstadoVideo, ClipSeleccionado, CalidadVideo
from ..entities.user import Usuario


class VideoDomainService:
    """Servicio de dominio para lógica compleja de videos."""

    @staticmethod
    def puede_generar_video(usuario: Usuario, duracion_solicitada: int) -> tuple[bool, Optional[str]]:
        """Verifica si un usuario puede generar un video con la duración solicitada."""
        if not usuario.puede_generar_video():
            limite = usuario.limites.videos_por_mes
            actual = usuario.videos_generados_mes_actual
            return False, f"Has alcanzado tu límite mensual de videos ({actual}/{limite})"

        if not usuario.puede_usar_duracion(duracion_solicitada):
            limite = usuario.limites.duracion_maxima_video
            return False, f"La duración solicitada ({duracion_solicitada}s) excede tu límite ({limite}s)"

        return True, None

    @staticmethod
    def calcular_tiempo_estimado_procesamiento(video: Video) -> int:
        """Calcula el tiempo estimado de procesamiento en segundos."""
        base_time = 30  # tiempo base en segundos

        # Factor por duración objetivo
        duration_factor = video.duracion_objetivo / 30  # 30s como referencia

        # Factor por número de clips
        clips_factor = len(video.clips_seleccionados) * 2  # 2s por clip

        # Factor por calidad
        quality_factors = {
            CalidadVideo.SD: 1.0,
            CalidadVideo.HD: 1.5,
            CalidadVideo.FHD: 2.0
        }
        quality_factor = quality_factors.get(video.calidad, 1.0)

        # Factor por template (si es premium, puede ser más complejo)
        template_factor = 1.3 if video.template.es_premium else 1.0

        tiempo_estimado = int(
            base_time * duration_factor * quality_factor * template_factor + clips_factor
        )

        return max(tiempo_estimado, 15)  # mínimo 15 segundos

    @staticmethod
    def optimizar_seleccion_clips(clips: List[ClipSeleccionado], duracion_objetivo: int) -> List[ClipSeleccionado]:
        """Optimiza la selección de clips para ajustarse a la duración objetivo."""
        if not clips:
            return clips

        # Ordenar clips por relevancia
        clips_ordenados = sorted(clips, key=lambda c: c.relevancia_score, reverse=True)

        clips_optimizados = []
        duracion_acumulada = 0.0

        for clip in clips_ordenados:
            duracion_clip = clip.posicion_fin - clip.posicion_inicio

            # Si añadir este clip no excede la duración objetivo
            if duracion_acumulada + duracion_clip <= duracion_objetivo:
                clips_optimizados.append(clip)
                duracion_acumulada += duracion_clip
            elif duracion_acumulada < duracion_objetivo:
                # Ajustar la duración del último clip para completar exactamente
                duracion_restante = duracion_objetivo - duracion_acumulada
                clip_ajustado = ClipSeleccionado(
                    id=clip.id,
                    url=clip.url,
                    duracion=duracion_restante,
                    posicion_inicio=clip.posicion_inicio,
                    posicion_fin=clip.posicion_inicio + duracion_restante,
                    relevancia_score=clip.relevancia_score,
                    metadatos=clip.metadatos
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
        if len(video.clips_seleccionados) == 0:
            validaciones['errores'].append("No hay clips seleccionados")
        else:
            validaciones['clips_suficientes'] = len(video.clips_seleccionados) >= 3

        # Validar duración de clips
        duracion_total = video.duracion_total_clips
        if duracion_total < video.duracion_objetivo * 0.8:
            validaciones['errores'].append("Los clips son muy cortos para la duración objetivo")
        elif duracion_total > video.duracion_objetivo * 1.5:
            validaciones['errores'].append("Los clips son muy largos para la duración objetivo")
        else:
            validaciones['duracion_clips_adecuada'] = True

        # Validar calidad promedio de clips
        if video.clips_seleccionados:
            relevancia_promedio = sum(c.relevancia_score for c in video.clips_seleccionados) / len(video.clips_seleccionados)
            validaciones['calidad_clips_adecuada'] = relevancia_promedio >= 0.5

        # Validar configuración de audio
        audio_valido = (
            video.audio_config.voz is not None and
            0.5 <= video.audio_config.velocidad <= 2.0 and
            0.0 <= video.audio_config.volumen <= 1.0
        )
        validaciones['audio_config_valido'] = audio_valido
        if not audio_valido:
            validaciones['errores'].append("Configuración de audio inválida")

        # Validar template
        validaciones['template_valido'] = bool(video.template.id and video.template.nombre)
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

        completados = [v for v in videos_periodo if v.estado == EstadoVideo.COMPLETADO]
        fallidos = [v for v in videos_periodo if v.estado == EstadoVideo.FALLIDO]

        # Calcular tiempo promedio de procesamiento
        tiempos_procesamiento = []
        for video in completados:
            if video.procesado_at:
                tiempo = (video.procesado_at - video.created_at).total_seconds()
                tiempos_procesamiento.append(tiempo)

        tiempo_promedio = sum(tiempos_procesamiento) / len(tiempos_procesamiento) if tiempos_procesamiento else 0

        # Calcular duración promedio de videos completados
        duraciones = [v.duracion_final for v in completados if v.duracion_final]
        duracion_promedio = sum(duraciones) / len(duraciones) if duraciones else 0

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
    def generar_metadatos_video(video: Video, script_keywords: List[str] = None) -> Dict[str, Any]:
        """Genera metadatos enriquecidos para el video."""
        metadatos = {
            'version': '1.0',
            'created_at': video.created_at.isoformat(),
            'duracion_objetivo': video.duracion_objetivo,
            'numero_clips': len(video.clips_seleccionados),
            'template_usado': video.template.nombre,
            'calidad': video.calidad.value,
            'config_audio': {
                'voz': video.audio_config.voz.value,
                'velocidad': video.audio_config.velocidad,
                'volumen': video.audio_config.volumen
            },
            'clips_info': [
                {
                    'id': clip.id,
                    'duracion': clip.posicion_fin - clip.posicion_inicio,
                    'relevancia': clip.relevancia_score
                }
                for clip in video.clips_seleccionados
            ]
        }

        if script_keywords:
            metadatos['keywords'] = script_keywords

        if video.duracion_final:
            metadatos['duracion_final'] = video.duracion_final
            metadatos['diferencia_duracion'] = abs(video.duracion_final - video.duracion_objetivo)

        return metadatos

    @staticmethod
    def recomendar_optimizaciones(video: Video) -> List[str]:
        """Recomienda optimizaciones para el video."""
        recomendaciones = []
        validacion = VideoDomainService.validar_configuracion_video(video)

        if not validacion['clips_suficientes']:
            recomendaciones.append("Añade más clips para mejorar la variedad visual")

        if not validacion['duracion_clips_adecuada']:
            duracion_total = video.duracion_total_clips
            if duracion_total < video.duracion_objetivo:
                recomendaciones.append("Los clips son muy cortos, considera clips más largos")
            else:
                recomendaciones.append("Los clips son muy largos, considera clips más cortos")

        if not validacion['calidad_clips_adecuada']:
            recomendaciones.append("Mejora la selección de clips eligiendo contenido más relevante")

        # Recomendaciones por calidad
        if video.calidad == CalidadVideo.SD:
            recomendaciones.append("Considera usar HD para mejor calidad visual")

        # Recomendaciones por audio
        if video.audio_config.velocidad > 1.5:
            recomendaciones.append("La velocidad de voz es alta, considera reducirla para mejor comprensión")

        return recomendaciones