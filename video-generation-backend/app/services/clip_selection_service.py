"""
Servicio de selección inteligente de clips para generación de videos

Este servicio implementa el algoritmo completo de selección de clips basado en:
1. Búsqueda por similitud de embeddings
2. Filtros de compatibilidad (categoría, duración, estado)
3. Puntuación específica por tipo de segmento
4. Evitar repeticiones
5. Verificación de coherencia temporal y visual
"""

import logging
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
from supabase import Client
import numpy as np
import json
from app.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


@dataclass
class ClipMetadata:
    """Metadatos completos de un clip de video"""
    id: str
    filename: str
    file_url: str
    duration: float
    category: str
    concept_tags: List[str]
    emotion_tags: List[str]
    scene_type: str
    dominant_colors: List[str]
    description: str
    keywords: List[str]
    embedding: List[float]
    quality_score: float
    motion_intensity: str
    is_active: bool
    usage_count: int
    success_rate: float
    basic_info: Dict
    visual_style: Dict
    positioning: Dict
    audio_compatibility: Dict
    utility_scores: Dict
    ai_matching: Dict


@dataclass
class SegmentClipMatch:
    """Match entre un segmento de script y un clip"""
    segment_text: str
    segment_type: str
    clip: ClipMetadata
    similarity_score: float
    segment_score: float
    final_score: float
    duration_compatibility: float


@dataclass
class TemporalSegment:
    """Segmento temporal con información de tiempo exacta"""
    text: str
    type: str
    duration: float
    emotion: str
    start_time: float
    end_time: float
    clips_needed: int
    clip_duration_target: float

@dataclass
class TimelineClipAssignment:
    """Asignación de clip a una posición temporal específica"""
    clip: ClipMetadata
    segment: TemporalSegment
    start_time: float
    end_time: float
    clip_role: str  # 'main', 'transition', 'filler'
    similarity_score: float
    segment_score: float
    final_score: float

@dataclass
class ClipSelectionResult:
    """Resultado completo de la selección de clips"""
    selected_clips: List[SegmentClipMatch]
    timeline_assignments: List[TimelineClipAssignment]
    total_duration: float
    audio_duration: float
    duration_compatibility: float
    visual_coherence_score: float
    estimated_engagement: float
    temporal_coverage: float
    warnings: List[str]


class ClipSelectionService:
    """
    Servicio principal para selección inteligente de clips
    """

    def __init__(self, supabase_client: Client):
        """
        Inicializa el servicio con cliente de Supabase

        Args:
            supabase_client: Cliente configurado de Supabase
        """
        self.supabase = supabase_client
        self.clips_cache: Dict[str, List[ClipMetadata]] = {}
        self._init_scoring_weights()

    def _parse_embedding(self, embedding_data) -> List[float]:
        """
        Convierte el embedding desde la base de datos a lista de floats

        Args:
            embedding_data: Datos de embedding desde la DB (puede ser string, lista, etc.)

        Returns:
            Lista de floats representando el embedding
        """
        try:
            if isinstance(embedding_data, str):
                # Si es string, intentar parsear como JSON
                parsed = json.loads(embedding_data)
                if isinstance(parsed, list):
                    return [float(x) for x in parsed]
                return []
            elif isinstance(embedding_data, list):
                # Si ya es lista, convertir a floats
                return [float(x) for x in embedding_data]
            else:
                # Si es None u otro tipo, retornar lista vacía
                return []
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning(f"⚠️ Error parseando embedding: {e}")
            return []

    def _init_scoring_weights(self):
        """Inicializa los pesos para scoring"""
        # Configuración de pesos para scoring
        self.SCORING_WEIGHTS = {
            "hook": {
                "similarity": 0.3,
                "motion_intensity": 0.25,
                "quality_score": 0.2,
                "hook_potential": 0.15,
                "success_rate": 0.1
            },
            "contenido": {
                "similarity": 0.4,
                "quality_score": 0.25,
                "motion_intensity": 0.15,
                "concept_relevance": 0.15,
                "duration_match": 0.05
            },
            "cta": {
                "similarity": 0.25,
                "emotion_positivity": 0.3,
                "duration_shortness": 0.2,
                "action_potential": 0.15,
                "quality_score": 0.1
            }
        }

    async def select_clips_for_script(
        self,
        enhanced_script: Dict,
        category: str,
        audio_duration: float,
        target_clips_count: int = 3
    ) -> ClipSelectionResult:
        """
        NUEVO: Selecciona clips con distribución proporcional temporal

        Args:
            enhanced_script: Script con segmentos (hook, contenido, cta)
            category: Categoría del video (tech, food, fitness, education)
            audio_duration: Duración real del audio generado
            target_clips_count: Número objetivo de clips (ignorado, se calcula automáticamente)

        Returns:
            ClipSelectionResult con clips seleccionados temporalmente
        """
        logger.info(f"🎬 NUEVA SELECCIÓN TEMPORAL - Categoría: {category}, Audio: {audio_duration:.1f}s")

        try:
            # 1. Cargar clips disponibles de la categoría
            available_clips = await self._load_clips_by_category(category)
            logger.info(f"📁 Clips disponibles en {category}: {len(available_clips)}")

            if not available_clips:
                raise ValueError(f"No hay clips disponibles en la categoría {category}")

            # 2. NUEVO: Crear mapeo temporal exacto
            temporal_segments = self._create_temporal_mapping(enhanced_script, audio_duration)

            # 3. NUEVO: Selección proporcional por segmento temporal
            timeline_assignments = await self._select_clips_proportionally(
                temporal_segments, available_clips, category
            )

            # 4. Convertir assignments a formato legacy para compatibilidad
            selected_clips = self._convert_timeline_to_legacy(timeline_assignments)

            # 5. Verificar cobertura temporal completa
            temporal_coverage = self._verify_temporal_coverage(timeline_assignments, audio_duration)

            # 6. Verificar coherencia visual
            visual_coherence = self._calculate_visual_coherence(selected_clips)

            # 7. Calcular métricas de engagement estimado
            engagement_score = self._calculate_engagement_estimate(selected_clips)

            # 8. Generar warnings para el nuevo sistema
            warnings = self._generate_temporal_warnings(
                timeline_assignments, temporal_coverage, visual_coherence
            )

            # 9. Calcular duración total de clips asignados
            total_duration = sum(assignment.end_time - assignment.start_time for assignment in timeline_assignments)

            result = ClipSelectionResult(
                selected_clips=selected_clips,
                timeline_assignments=timeline_assignments,
                total_duration=total_duration,
                audio_duration=audio_duration,
                duration_compatibility=temporal_coverage,
                visual_coherence_score=visual_coherence,
                estimated_engagement=engagement_score,
                temporal_coverage=temporal_coverage,
                warnings=warnings
            )

            logger.info(f"✅ NUEVA SELECCIÓN COMPLETADA:")
            logger.info(f"   🎬 Total clips: {len(selected_clips)}")
            logger.info(f"   🕒 Cobertura temporal: {temporal_coverage:.1%}")
            logger.info(f"   🎨 Coherencia visual: {visual_coherence:.2f}")
            logger.info(f"   ⚡ Engagement estimado: {engagement_score:.2f}")

            return result

        except Exception as e:
            logger.error(f"❌ Error en selección temporal de clips: {e}")
            raise ValueError(f"Error seleccionando clips: {e}")

    async def _load_clips_by_category(self, category: str) -> List[ClipMetadata]:
        """
        Carga clips activos de una categoría específica desde Supabase
        """
        if category in self.clips_cache:
            return self.clips_cache[category]

        try:
            logger.info(f"🔍 Cargando clips de categoría: {category}")
            # logger para ver si supabase está bien inicializado
            logger.info(f"Supabase URL: {settings.SUPABASE_URL}")
            logger.info(f"Supabase ANON KEY: {settings.SUPABASE_ANON_KEY}")
            response = self.supabase.table("asset_clips").select("*").eq(
                "is_active", True
            ).ilike("filename", f"{category}/%").execute()

            clips = []
            for row in response.data:
                clip = ClipMetadata(
                    id=row["id"],
                    filename=row["filename"],
                    file_url=row["file_url"],
                    duration=row["duration"],
                    category=category,
                    concept_tags=row.get("concept_tags", []),
                    emotion_tags=row.get("emotion_tags", []),
                    scene_type=row.get("scene_type", ""),
                    dominant_colors=row.get("dominant_colors", []),
                    description=row.get("description", ""),
                    keywords=row.get("keywords", []),
                    embedding=self._parse_embedding(row.get("embedding", [])),
                    quality_score=row.get("quality_score", 0.0),
                    motion_intensity=row.get("motion_intensity", "medium"),
                    is_active=row.get("is_active", True),
                    usage_count=row.get("usage_count", 0),
                    success_rate=row.get("success_rate", 0.0),
                    basic_info=row.get("basic_info", {}),
                    visual_style=row.get("visual_style", {}),
                    positioning=row.get("positioning", {}),
                    audio_compatibility=row.get("audio_compatibility", {}),
                    utility_scores=row.get("utility_scores", {}),
                    ai_matching=row.get("ai_matching", {})
                )
                clips.append(clip)

            # Cachear resultados
            self.clips_cache[category] = clips
            return clips

        except Exception as e:
            logger.error(f"❌ Error cargando clips de {category}: {e}")
            return []

    def _extract_segments_from_script(self, enhanced_script: Dict) -> List[Dict]:
        """
        Extrae segmentos del script mejorado
        """
        segments = []

        if "segmentos" in enhanced_script:
            for seg in enhanced_script["segmentos"]:
                segments.append({
                    "text": seg.get("texto", ""),
                    "type": seg.get("tipo", "contenido"),
                    "duration": seg.get("duracion", 1.0),
                    "emotion": seg.get("emocion", "neutral")
                })

        return segments

    def _create_temporal_mapping(self, enhanced_script: Dict, audio_duration: float) -> List[TemporalSegment]:
        """
        Crea mapeo temporal exacto para cada segmento basándose en la duración real del audio
        """
        segments = self._extract_segments_from_script(enhanced_script)

        if not segments:
            logger.warning("⚠️ No se encontraron segmentos, creando mapeo básico")
            return [TemporalSegment(
                text=enhanced_script.get("script_mejorado", ""),
                type="contenido",
                duration=audio_duration,
                emotion="neutral",
                start_time=0.0,
                end_time=audio_duration,
                clips_needed=self._calculate_clips_needed(audio_duration, "contenido"),
                clip_duration_target=audio_duration / max(1, self._calculate_clips_needed(audio_duration, "contenido"))
            )]

        temporal_segments = []
        current_time = 0.0

        for segment in segments:
            segment_duration = segment.get("duration", 1.0)
            # Ajustar duración proporcionalmente al audio real
            if sum(s.get("duration", 1.0) for s in segments) > 0:
                proportional_duration = (segment_duration / sum(s.get("duration", 1.0) for s in segments)) * audio_duration
            else:
                proportional_duration = audio_duration / len(segments)

            clips_needed = self._calculate_clips_needed(proportional_duration, segment["type"])

            temporal_segment = TemporalSegment(
                text=segment["text"],
                type=segment["type"],
                duration=proportional_duration,
                emotion=segment.get("emotion", "neutral"),
                start_time=current_time,
                end_time=current_time + proportional_duration,
                clips_needed=clips_needed,
                clip_duration_target=proportional_duration / max(1, clips_needed)
            )

            temporal_segments.append(temporal_segment)
            current_time += proportional_duration

        logger.info(f"🕒 Mapeo temporal creado: {len(temporal_segments)} segmentos")
        for seg in temporal_segments:
            logger.info(f"   📍 {seg.type} ({seg.start_time:.1f}s-{seg.end_time:.1f}s): {seg.clips_needed} clips")

        return temporal_segments

    def _calculate_clips_needed(self, duration: float, segment_type: str) -> int:
        """
        Calcula cuántos clips necesita un segmento según su duración y tipo
        """
        # Configuración de clips por tipo de segmento
        CLIP_DENSITY_CONFIG = {
            "hook": {"clips_per_second": 0.15, "min_clips": 1, "max_clips": 2},      # Hook: 1 clip por 6-7s
            "intro": {"clips_per_second": 0.15, "min_clips": 1, "max_clips": 2},     # Intro: 1 clip por 6-7s
            "contenido": {"clips_per_second": 0.20, "min_clips": 1, "max_clips": 6}, # Contenido: 1 clip por 5s
            "content": {"clips_per_second": 0.20, "min_clips": 1, "max_clips": 6},   # Content: 1 clip por 5s
            "cta": {"clips_per_second": 0.15, "min_clips": 1, "max_clips": 2},       # CTA: 1 clip por 6-7s
            "conclusion": {"clips_per_second": 0.15, "min_clips": 1, "max_clips": 2} # Conclusion: 1 clip por 6-7s
        }

        config = CLIP_DENSITY_CONFIG.get(segment_type, CLIP_DENSITY_CONFIG["contenido"])

        calculated_clips = max(1, round(duration * config["clips_per_second"]))
        final_clips = max(config["min_clips"], min(config["max_clips"], calculated_clips))

        logger.debug(f"🎬 {segment_type} ({duration:.1f}s) → {final_clips} clips")
        return final_clips

    async def _select_clips_proportionally(
        self,
        temporal_segments: List[TemporalSegment],
        available_clips: List[ClipMetadata],
        category: str
    ) -> List[TimelineClipAssignment]:
        """
        Selecciona clips distribuidos proporcionalmente por cada segmento temporal
        """
        timeline_assignments = []
        used_clip_ids: Set[str] = set()
        used_source_videos: Set[str] = set()

        logger.info(f"🎯 Iniciando selección proporcional para {len(temporal_segments)} segmentos")

        for segment_idx, segment in enumerate(temporal_segments):
            logger.info(f"📍 Procesando {segment.type} ({segment.start_time:.1f}s-{segment.end_time:.1f}s): {segment.clips_needed} clips")

            # Buscar candidatos específicos para este tipo de segmento
            segment_dict = {
                "text": segment.text,
                "type": segment.type,
                "duration": segment.duration,
                "emotion": segment.emotion
            }

            candidates = await self._find_candidates_for_segment(
                segment_dict, available_clips, category
            )

            # Filtrar candidatos ya usados
            available_candidates = []
            for clip, similarity in candidates:
                if clip.id in used_clip_ids:
                    continue

                source_id = str(clip.basic_info.get("id", ""))
                if source_id and source_id in used_source_videos:
                    continue

                # Aplicar filtros específicos por tipo de segmento
                if self._passes_segment_filters(clip, segment.type):
                    available_candidates.append((clip, similarity))

            if not available_candidates:
                logger.warning(f"⚠️ No hay candidatos disponibles para {segment.type}")
                continue

            # Seleccionar mejores clips para este segmento
            segment_assignments = self._select_clips_for_segment(
                segment, available_candidates, used_clip_ids, used_source_videos
            )

            timeline_assignments.extend(segment_assignments)

            # Actualizar clips usados
            for assignment in segment_assignments:
                used_clip_ids.add(assignment.clip.id)
                source_id = str(assignment.clip.basic_info.get("id", ""))
                if source_id:
                    used_source_videos.add(source_id)

            logger.info(f"   ✅ {segment.type}: {len(segment_assignments)} clips asignados")

        # Agregar transiciones entre segmentos si es necesario
        if len(temporal_segments) > 1:
            transition_assignments = await self._add_transitions_between_segments(
                temporal_segments, available_clips, used_clip_ids, used_source_videos, category
            )
            timeline_assignments.extend(transition_assignments)

        # Ordenar por tiempo de inicio
        timeline_assignments.sort(key=lambda x: x.start_time)

        total_clips = len(timeline_assignments)
        logger.info(f"🎬 Selección proporcional completada: {total_clips} clips + transiciones")

        return timeline_assignments

    def _passes_segment_filters(self, clip: ClipMetadata, segment_type: str) -> bool:
        """
        Aplica filtros específicos según el tipo de segmento
        """
        if segment_type in ["hook", "intro"]:
            # Hook necesita clips dinámicos con alto motion
            motion_score = self._get_motion_score(clip.motion_intensity)
            return motion_score >= 0.6 and clip.quality_score >= 3.0

        elif segment_type in ["contenido", "content"]:
            # Contenido necesita clips informativos de calidad
            return clip.quality_score >= 2.5

        elif segment_type in ["cta", "conclusion"]:
            # CTA necesita clips con energía y call-to-action potential
            outro_potential = clip.positioning.get("outro_potential", 0) / 10.0
            return outro_potential >= 0.3 and clip.quality_score >= 3.0

        return True  # Default: acepta el clip

    def _select_clips_for_segment(
        self,
        segment: TemporalSegment,
        candidates: List[Tuple[ClipMetadata, float]],
        used_clip_ids: Set[str],
        used_source_videos: Set[str]
    ) -> List[TimelineClipAssignment]:
        """
        Selecciona clips específicos para un segmento temporal
        """
        assignments = []
        current_time = segment.start_time
        remaining_duration = segment.duration

        # Ordenar candidatos por puntuación combinada
        scored_candidates = []
        for clip, similarity in candidates:
            segment_dict = {
                "text": segment.text,
                "type": segment.type,
                "duration": segment.duration,
                "emotion": segment.emotion
            }
            segment_score = self._calculate_segment_score(clip, segment.type, segment_dict)
            final_score = similarity * 0.6 + segment_score * 0.4
            scored_candidates.append((clip, similarity, segment_score, final_score))

        scored_candidates.sort(key=lambda x: x[3], reverse=True)

        clips_selected = 0
        for clip, similarity, segment_score, final_score in scored_candidates:
            if clips_selected >= segment.clips_needed:
                break

            if remaining_duration <= 0:
                break

            # Calcular duración del clip para este assignment
            clip_duration = min(clip.duration, remaining_duration, segment.clip_duration_target * 1.5)

            if clip_duration < 0.5:  # Clips muy cortos no son útiles
                continue

            assignment = TimelineClipAssignment(
                clip=clip,
                segment=segment,
                start_time=current_time,
                end_time=current_time + clip_duration,
                clip_role='main',
                similarity_score=similarity,
                segment_score=segment_score,
                final_score=final_score
            )

            assignments.append(assignment)
            current_time += clip_duration
            remaining_duration -= clip_duration
            clips_selected += 1

        return assignments

    async def _add_transitions_between_segments(
        self,
        temporal_segments: List[TemporalSegment],
        available_clips: List[ClipMetadata],
        used_clip_ids: Set[str],
        used_source_videos: Set[str],
        category: str
    ) -> List[TimelineClipAssignment]:
        """
        Agrega clips de transición entre segmentos para suavizar cambios
        """
        transition_assignments = []
        TRANSITION_DURATION = 0.5  # 500ms por transición

        logger.info(f"🔄 Agregando transiciones entre {len(temporal_segments)} segmentos")

        for i in range(len(temporal_segments) - 1):
            current_segment = temporal_segments[i]
            next_segment = temporal_segments[i + 1]

            # Calcular punto de transición
            transition_start = current_segment.end_time - (TRANSITION_DURATION / 2)
            transition_end = next_segment.start_time + (TRANSITION_DURATION / 2)

            # Buscar clips de transición adecuados
            transition_clips = self._find_transition_clips(
                available_clips, used_clip_ids, used_source_videos, current_segment.type, next_segment.type
            )

            if transition_clips:
                best_clip = transition_clips[0]  # Tomar el mejor clip de transición

                assignment = TimelineClipAssignment(
                    clip=best_clip,
                    segment=current_segment,  # Asignar al segmento anterior
                    start_time=transition_start,
                    end_time=transition_end,
                    clip_role='transition',
                    similarity_score=0.7,  # Score moderado para transiciones
                    segment_score=0.6,
                    final_score=0.65
                )

                transition_assignments.append(assignment)
                used_clip_ids.add(best_clip.id)

                source_id = str(best_clip.basic_info.get("id", ""))
                if source_id:
                    used_source_videos.add(source_id)

                logger.info(f"   🔄 Transición {current_segment.type}→{next_segment.type}: {best_clip.filename}")

        logger.info(f"✅ {len(transition_assignments)} transiciones agregadas")
        return transition_assignments

    def _find_transition_clips(
        self,
        available_clips: List[ClipMetadata],
        used_clip_ids: Set[str],
        used_source_videos: Set[str],
        from_type: str,
        to_type: str
    ) -> List[ClipMetadata]:
        """
        Encuentra clips adecuados para transiciones entre tipos de segmento
        """
        transition_clips = []

        for clip in available_clips:
            # Evitar clips ya usados
            if clip.id in used_clip_ids:
                continue

            source_id = str(clip.basic_info.get("id", ""))
            if source_id and source_id in used_source_videos:
                continue

            # Filtros para clips de transición
            if not self._is_good_transition_clip(clip, from_type, to_type):
                continue

            transition_clips.append(clip)

        # Ordenar por adecuación para transición
        transition_clips.sort(key=lambda clip: self._calculate_transition_score(clip, from_type, to_type), reverse=True)

        return transition_clips[:3]  # Retornar top 3 candidatos

    def _is_good_transition_clip(self, clip: ClipMetadata, from_type: str, to_type: str) -> bool:
        """
        Determina si un clip es adecuado para transición
        """
        # Clips de transición deben ser cortos y de calidad moderada
        if clip.duration > 3.0 or clip.quality_score < 2.0:
            return False

        # Verificar motion intensity apropiada para transición
        motion_score = self._get_motion_score(clip.motion_intensity)

        # Para hook→contenido: transición suave (motion medio)
        if from_type in ["hook", "intro"] and to_type in ["contenido", "content"]:
            return 0.4 <= motion_score <= 0.7

        # Para contenido→cta: transición energética (motion alto)
        elif from_type in ["contenido", "content"] and to_type in ["cta", "conclusion"]:
            return motion_score >= 0.6

        return motion_score >= 0.3  # Default: motion mínimo

    def _calculate_transition_score(self, clip: ClipMetadata, from_type: str, to_type: str) -> float:
        """
        Calcula puntuación específica para clips de transición
        """
        score = 0.0

        # Score base por calidad
        score += (clip.quality_score / 5.0) * 0.3

        # Score por duración (clips cortos son mejores para transiciones)
        duration_score = max(0, 1.0 - (clip.duration / 5.0))
        score += duration_score * 0.3

        # Score por motion intensity
        motion_score = self._get_motion_score(clip.motion_intensity)
        if from_type in ["contenido", "content"] and to_type in ["cta", "conclusion"]:
            # Para contenido→CTA: preferir motion alto
            score += motion_score * 0.4
        else:
            # Para otras transiciones: preferir motion medio
            optimal_motion = 0.6
            motion_compatibility = 1.0 - abs(motion_score - optimal_motion)
            score += motion_compatibility * 0.4

        return min(1.0, score)

    async def _find_candidates_for_segment(
        self,
        segment: Dict,
        available_clips: List[ClipMetadata],
        category: str
    ) -> List[Tuple[ClipMetadata, float]]:
        """
        Encuentra clips candidatos para un segmento específico
        """
        if not embedding_service:
            logger.warning("⚠️ Servicio de embeddings no disponible")
            return [(clip, 0.5) for clip in available_clips[:10]]

        try:
            # Generar embedding del segmento
            segment_embedding = embedding_service.generate_script_embedding(
                embedding_service.prepare_script_text(
                    segment["text"], category, [segment["type"]]
                )
            )

            candidates = []
            for clip in available_clips:
                # Filtros básicos
                if not self._passes_basic_filters(clip, segment):
                    continue

                # Calcular similitud semántica
                similarity = embedding_service.calculate_similarity(
                    segment_embedding, clip.embedding
                ) if clip.embedding else 0.0

                # Calcular puntuación específica del segmento
                segment_score = self._calculate_segment_score(
                    clip, segment["type"], segment
                )

                candidates.append((clip, similarity, segment_score))

            # Ordenar por puntuación combinada y tomar top 15
            candidates.sort(
                key=lambda x: (x[1] * 0.6 + x[2] * 0.4), reverse=True
            )

            return [(clip, sim) for clip, sim, _ in candidates[:15]]

        except Exception as e:
            logger.error(f"❌ Error buscando candidatos: {e}")
            return [(clip, 0.5) for clip in available_clips[:10]]

    def _passes_basic_filters(self, clip: ClipMetadata, segment: Dict) -> bool:
        """
        Verifica que el clip pase los filtros básicos
        """
        # Clip debe estar activo
        if not clip.is_active:
            return False

        # Duración compatible (no más del doble del segmento)
        segment_duration = segment.get("duration", 1.0)
        if clip.duration > segment_duration * 2.5:
            return False

        # Quality score mínimo
        if clip.quality_score < 3.0:
            return False

        return True

    def _calculate_segment_score(
        self, clip: ClipMetadata, segment_type: str, segment: Dict
    ) -> float:
        """
        Calcula puntuación específica según el tipo de segmento
        """
        weights = self.SCORING_WEIGHTS.get(
            segment_type, self.SCORING_WEIGHTS["contenido"])
        score = 0.0

        if segment_type == "hook":
            # Para hooks: movimiento, calidad, potencial de hook
            motion_score = self._get_motion_score(clip.motion_intensity)
            hook_potential = clip.positioning.get("hook_potential", 0) / 10.0

            score = (
                weights["motion_intensity"] * motion_score +
                weights["quality_score"] * (clip.quality_score / 5.0) +
                weights["hook_potential"] * hook_potential +
                weights["success_rate"] * (clip.success_rate / 100.0)
            )

        elif segment_type == "contenido":
            # Para contenido: relevancia, calidad, movimiento moderado
            concept_relevance = self._calculate_concept_relevance(
                clip, segment)
            duration_match = self._calculate_duration_match(clip, segment)

            score = (
                weights["quality_score"] * (clip.quality_score / 5.0) +
                weights["concept_relevance"] * concept_relevance +
                weights["duration_match"] * duration_match +
                weights["motion_intensity"] *
                    (1.0 - abs(0.5 - self._get_motion_score(clip.motion_intensity)))
            )

        elif segment_type == "cta":
            # Para CTA: positividad emocional, duración corta, acción
            emotion_positivity = self._get_emotion_positivity(
                clip.emotion_tags)
            duration_shortness = max(0, 1.0 - (clip.duration / 10.0))
            action_potential = clip.positioning.get(
                "outro_potential", 0) / 10.0

            score = (
                weights["emotion_positivity"] * emotion_positivity +
                weights["duration_shortness"] * duration_shortness +
                weights["action_potential"] * action_potential +
                weights["quality_score"] * (clip.quality_score / 5.0)
            )

        return min(1.0, max(0.0, score))

    def _get_motion_score(self, motion_intensity: str) -> float:
        """Convierte intensidad de movimiento a score numérico"""
        motion_map = {"low": 0.2, "medium": 0.6, "high": 1.0}
        return motion_map.get(motion_intensity, 0.5)

    def _calculate_concept_relevance(self, clip: ClipMetadata, segment: Dict) -> float:
        """Calcula relevancia conceptual entre clip y segmento"""
        segment_words = set(segment["text"].lower().split())
        clip_concepts = set([tag.lower()
                            for tag in clip.concept_tags + clip.keywords])

        if not clip_concepts:
            return 0.5

        intersection = segment_words.intersection(clip_concepts)
        return len(intersection) / max(len(segment_words), len(clip_concepts))

    def _calculate_duration_match(self, clip: ClipMetadata, segment: Dict) -> float:
        """Calcula compatibilidad de duración"""
        segment_duration = segment.get("duration", 1.0)
        ratio = min(clip.duration, segment_duration) / \
            max(clip.duration, segment_duration)
        return ratio

    def _get_emotion_positivity(self, emotion_tags: List[str]) -> float:
        """Calcula positividad emocional de las etiquetas"""
        positive_emotions = {"happy", "excited",
                             "energetic", "joyful", "upbeat"}
        neutral_emotions = {"neutral", "calm", "focused"}

        if not emotion_tags:
            return 0.5

        positive_count = sum(
            1 for tag in emotion_tags if tag.lower() in positive_emotions)
        neutral_count = sum(
            1 for tag in emotion_tags if tag.lower() in neutral_emotions)

        return (positive_count + neutral_count * 0.5) / len(emotion_tags)

    def _select_optimal_clips_with_duration(
        self,
        segment_candidates: List[Tuple[Dict, List[Tuple[ClipMetadata, float]]]],
        target_count: int,
        audio_duration: float
    ) -> List[SegmentClipMatch]:
        """
        Selecciona clips óptimos considerando duración total y evitando repeticiones
        """
        selected_clips = []
        used_clip_ids: Set[str] = set()
        used_source_videos: Set[str] = set()
        total_duration = 0.0
        target_duration = audio_duration * 0.9  # Apuntar a 90% de la duración del audio

        # Crear una lista de todos los candidatos con puntuaciones
        all_candidates = []
        for segment, candidates in segment_candidates:
            for clip, similarity in candidates:
                if clip.id not in used_clip_ids:
                    segment_score = self._calculate_segment_score(clip, segment["type"], segment)
                    final_score = similarity * 0.6 + segment_score * 0.4
                    all_candidates.append({
                        'segment': segment,
                        'clip': clip,
                        'similarity': similarity,
                        'segment_score': segment_score,
                        'final_score': final_score
                    })

        # Ordenar por puntuación
        all_candidates.sort(key=lambda x: x['final_score'], reverse=True)

        # Seleccionar clips hasta alcanzar la duración objetivo o el número máximo
        for candidate in all_candidates:
            if len(selected_clips) >= target_count:
                break

            clip = candidate['clip']
            segment = candidate['segment']

            # Evitar repeticiones de clip
            if clip.id in used_clip_ids:
                continue

            # Evitar repeticiones de video fuente (Pexels ID)
            source_id = str(clip.basic_info.get("id", ""))
            if source_id and source_id in used_source_videos:
                continue

            # Si ya hemos cubierto suficiente duración, solo añadir clips muy buenos
            if total_duration >= target_duration and candidate['final_score'] < 0.7:
                continue

            duration_compat = self._calculate_duration_match(clip, segment)

            match = SegmentClipMatch(
                segment_text=segment["text"],
                segment_type=segment["type"],
                clip=clip,
                similarity_score=candidate['similarity'],
                segment_score=candidate['segment_score'],
                final_score=candidate['final_score'],
                duration_compatibility=duration_compat
            )

            selected_clips.append(match)
            used_clip_ids.add(clip.id)
            total_duration += clip.duration

            if source_id:
                used_source_videos.add(source_id)

        # Si aún no tenemos suficiente duración, añadir más clips de menor calidad
        if total_duration < target_duration * 0.7 and len(selected_clips) < target_count:
            for candidate in all_candidates:
                if len(selected_clips) >= target_count:
                    break

                clip = candidate['clip']
                segment = candidate['segment']

                if clip.id in used_clip_ids:
                    continue

                duration_compat = self._calculate_duration_match(clip, segment)

                match = SegmentClipMatch(
                    segment_text=segment["text"],
                    segment_type=segment["type"],
                    clip=clip,
                    similarity_score=candidate['similarity'],
                    segment_score=candidate['segment_score'],
                    final_score=candidate['final_score'],
                    duration_compatibility=duration_compat
                )

                selected_clips.append(match)
                used_clip_ids.add(clip.id)
                total_duration += clip.duration

        logger.info(f"📊 Seleccionados {len(selected_clips)} clips con duración total: {total_duration:.1f}s (objetivo: {audio_duration:.1f}s)")
        return selected_clips

    def _select_optimal_clips(
        self,
        segment_candidates: List[Tuple[Dict, List[Tuple[ClipMetadata, float]]]],
        target_count: int
    ) -> List[SegmentClipMatch]:
        """
        Selecciona clips óptimos evitando repeticiones
        """
        selected_clips = []
        used_clip_ids: Set[str] = set()
        used_source_videos: Set[str] = set()

        for segment, candidates in segment_candidates:
            best_clip = None
            best_score = -1

            for clip, similarity in candidates:
                # Evitar repeticiones de clip
                if clip.id in used_clip_ids:
                    continue

                # Evitar repeticiones de video fuente (Pexels ID)
                source_id = str(clip.basic_info.get("id", ""))
                if source_id and source_id in used_source_videos:
                    continue

                # Calcular puntuación específica del segmento
                segment_score = self._calculate_segment_score(
                    clip, segment["type"], segment
                )

                # Puntuación final combinada
                final_score = similarity * 0.6 + segment_score * 0.4

                if final_score > best_score:
                    best_score = final_score
                    best_clip = (clip, similarity, segment_score)

            if best_clip:
                clip, similarity, segment_score = best_clip
                duration_compat = self._calculate_duration_match(clip, segment)

                match = SegmentClipMatch(
                    segment_text=segment["text"],
                    segment_type=segment["type"],
                    clip=clip,
                    similarity_score=similarity,
                    segment_score=segment_score,
                    final_score=best_score,
                    duration_compatibility=duration_compat
                )

                selected_clips.append(match)
                used_clip_ids.add(clip.id)

                source_id = str(clip.basic_info.get("id", ""))
                if source_id:
                    used_source_videos.add(source_id)

        return selected_clips

    def _verify_temporal_coherence(
        self, selected_clips: List[SegmentClipMatch], audio_duration: float
    ) -> float:
        """
        Verifica coherencia temporal entre clips y audio
        """
        if not selected_clips:
            return 0.0

        total_clip_duration = sum(
            clip.clip.duration for clip in selected_clips)

        # Ratio ideal es entre 0.8 y 1.2
        ratio = total_clip_duration / audio_duration if audio_duration > 0 else 0

        if 0.8 <= ratio <= 1.2:
            return 1.0
        elif 0.6 <= ratio <= 1.5:
            return 0.7
        else:
            return 0.3

    def _calculate_visual_coherence(self, selected_clips: List[SegmentClipMatch]) -> float:
        """
        Calcula coherencia visual entre clips seleccionados
        """
        if len(selected_clips) < 2:
            return 1.0

        coherence_scores = []

        for i in range(len(selected_clips) - 1):
            current_clip = selected_clips[i].clip
            next_clip = selected_clips[i + 1].clip

            # Coherencia de intensidad de movimiento
            motion_coherence = self._calculate_motion_coherence(
                current_clip.motion_intensity, next_clip.motion_intensity
            )

            # Coherencia de colores dominantes
            color_coherence = self._calculate_color_coherence(
                current_clip.dominant_colors, next_clip.dominant_colors
            )

            # Coherencia de estilo visual
            style_coherence = self._calculate_style_coherence(
                current_clip.visual_style, next_clip.visual_style
            )

            clip_coherence = (motion_coherence +
                              color_coherence + style_coherence) / 3
            coherence_scores.append(clip_coherence)

        return sum(coherence_scores) / len(coherence_scores)

    def _calculate_motion_coherence(self, motion1: str, motion2: str) -> float:
        """Calcula coherencia entre intensidades de movimiento"""
        motion_values = {"low": 1, "medium": 2, "high": 3}
        val1 = motion_values.get(motion1, 2)
        val2 = motion_values.get(motion2, 2)

        diff = abs(val1 - val2)
        return 1.0 - (diff / 2.0)

    def _calculate_color_coherence(self, colors1: List[str], colors2: List[str]) -> float:
        """Calcula coherencia entre paletas de colores"""
        if not colors1 or not colors2:
            return 0.5

        # Simplificado: verificar si hay colores similares
        similar_colors = set(colors1[:2]).intersection(set(colors2[:2]))
        return len(similar_colors) / 2.0

    def _calculate_style_coherence(self, style1: Dict, style2: Dict) -> float:
        """Calcula coherencia entre estilos visuales"""
        if not style1 or not style2:
            return 0.5

        coherence = 0.0
        factors = 0

        # Coherencia de brillo
        if "brightness_level" in style1 and "brightness_level" in style2:
            brightness_diff = abs(
                style1["brightness_level"] - style2["brightness_level"])
            coherence += max(0, 1.0 - brightness_diff / 100.0)
            factors += 1

        # Coherencia de saturación
        if "saturation_level" in style1 and "saturation_level" in style2:
            saturation_diff = abs(
                style1["saturation_level"] - style2["saturation_level"])
            coherence += max(0, 1.0 - saturation_diff / 100.0)
            factors += 1

        return coherence / max(1, factors)

    def _calculate_engagement_estimate(self, selected_clips: List[SegmentClipMatch]) -> float:
        """
        Estima el potencial de engagement basado en los clips seleccionados
        """
        if not selected_clips:
            return 0.0

        total_score = 0.0
        for clip_match in selected_clips:
            clip = clip_match.clip

            # Factores de engagement
            quality_factor = clip.quality_score / 5.0
            motion_factor = self._get_motion_score(clip.motion_intensity)
            success_factor = clip.success_rate / 100.0
            similarity_factor = clip_match.similarity_score

            # Peso según tipo de segmento
            if clip_match.segment_type == "hook":
                clip_score = (quality_factor * 0.3 + motion_factor * 0.4 +
                              success_factor * 0.2 + similarity_factor * 0.1)
            elif clip_match.segment_type == "cta":
                emotion_factor = self._get_emotion_positivity(
                    clip.emotion_tags)
                clip_score = (quality_factor * 0.2 + emotion_factor * 0.4 +
                              similarity_factor * 0.4)
            else:  # contenido
                clip_score = (quality_factor * 0.4 + similarity_factor * 0.4 +
                              motion_factor * 0.2)

            total_score += clip_score

        return total_score / len(selected_clips)

    def _generate_warnings(
        self,
        selected_clips: List[SegmentClipMatch],
        audio_duration: float,
        visual_coherence: float
    ) -> List[str]:
        """
        Genera warnings sobre la selección de clips
        """
        warnings = []

        if not selected_clips:
            warnings.append("No se pudieron seleccionar clips para el script")
            return warnings

        # Warning de duración
        total_duration = sum(clip.clip.duration for clip in selected_clips)
        duration_ratio = total_duration / audio_duration if audio_duration > 0 else 0

        if duration_ratio < 0.7:
            warnings.append(
                f"Los clips son muy cortos para el audio ({total_duration:.1f}s vs {audio_duration:.1f}s)")
        elif duration_ratio > 1.4:
            warnings.append(
                f"Los clips son muy largos para el audio ({total_duration:.1f}s vs {audio_duration:.1f}s)")

        # Warning de coherencia visual
        if visual_coherence < 0.6:
            warnings.append(
                "Baja coherencia visual entre clips - pueden verse desconectados")

        # Warning de calidad
        avg_quality = sum(
            clip.clip.quality_score for clip in selected_clips) / len(selected_clips)
        if avg_quality < 4.0:
            warnings.append(
                f"Calidad promedio de clips es baja ({avg_quality:.1f}/5.0)")

        # Warning de similitud
        avg_similarity = sum(
            clip.similarity_score for clip in selected_clips) / len(selected_clips)
        if avg_similarity < 0.5:
            warnings.append(
                f"Baja similitud semántica promedio ({avg_similarity:.2f})")

        return warnings

    def _convert_timeline_to_legacy(self, timeline_assignments: List[TimelineClipAssignment]) -> List[SegmentClipMatch]:
        """
        Convierte timeline assignments al formato legacy para compatibilidad
        """
        legacy_clips = []

        for assignment in timeline_assignments:
            # Solo convertir clips principales, no transiciones
            if assignment.clip_role == 'main':
                match = SegmentClipMatch(
                    segment_text=assignment.segment.text,
                    segment_type=assignment.segment.type,
                    clip=assignment.clip,
                    similarity_score=assignment.similarity_score,
                    segment_score=assignment.segment_score,
                    final_score=assignment.final_score,
                    duration_compatibility=1.0  # Asumimos buena compatibilidad ya que fue calculada
                )
                legacy_clips.append(match)

        return legacy_clips

    def _verify_temporal_coverage(self, timeline_assignments: List[TimelineClipAssignment], audio_duration: float) -> float:
        """
        Verifica que el timeline tenga cobertura completa del audio
        """
        if not timeline_assignments:
            return 0.0

        # Crear array de cobertura temporal
        time_slots = [False] * int(audio_duration * 10)  # Granularidad de 0.1s

        for assignment in timeline_assignments:
            start_slot = int(assignment.start_time * 10)
            end_slot = int(assignment.end_time * 10)

            # Marcar slots cubiertos
            for slot in range(start_slot, min(end_slot, len(time_slots))):
                time_slots[slot] = True

        # Calcular porcentaje de cobertura
        covered_slots = sum(time_slots)
        coverage = covered_slots / len(time_slots) if time_slots else 0.0

        logger.info(f"📊 Cobertura temporal: {coverage:.1%} ({covered_slots}/{len(time_slots)} slots)")
        return coverage

    def _generate_temporal_warnings(
        self,
        timeline_assignments: List[TimelineClipAssignment],
        temporal_coverage: float,
        visual_coherence: float
    ) -> List[str]:
        """
        Genera warnings específicos para el sistema temporal
        """
        warnings = []

        # Warning por cobertura temporal baja
        if temporal_coverage < 0.8:
            warnings.append(f"Cobertura temporal baja: {temporal_coverage:.1%}. Algunos segundos pueden quedar sin video.")

        # Warning por falta de clips en segmentos específicos
        segment_types = set(assignment.segment.type for assignment in timeline_assignments if assignment.clip_role == 'main')

        if 'hook' not in segment_types and 'intro' not in segment_types:
            warnings.append("No se encontraron clips para el Hook/Intro. El inicio del video puede carecer de impacto visual.")

        if 'cta' not in segment_types and 'conclusion' not in segment_types:
            warnings.append("No se encontraron clips para el CTA/Conclusión. El final del video puede carecer de energía.")

        # Warning por coherencia visual baja
        if visual_coherence < 0.6:
            warnings.append(f"Coherencia visual baja: {visual_coherence:.2f}. Los clips pueden verse desconectados.")

        # Warning por falta de transiciones
        transition_count = sum(1 for assignment in timeline_assignments if assignment.clip_role == 'transition')
        expected_transitions = len(set(assignment.segment.type for assignment in timeline_assignments)) - 1

        if transition_count < expected_transitions:
            warnings.append(f"Faltan transiciones: {transition_count}/{expected_transitions}. Los cambios entre segmentos pueden ser abruptos.")

        # Warning por clips muy cortos
        short_clips = [a for a in timeline_assignments if (a.end_time - a.start_time) < 1.0 and a.clip_role == 'main']
        if len(short_clips) > len(timeline_assignments) * 0.5:
            warnings.append("Muchos clips son muy cortos (<1s). Considera usar clips más largos para mejor fluidez.")

        return warnings


# Función de conveniencia para crear el servicio
def create_clip_selection_service() -> Optional[ClipSelectionService]:
    """
    Crea una instancia del servicio de selección de clips
    """
    try:
        from supabase import create_client

        supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )

        logger.info("✅ Servicio de selección de clips inicializado")
        logger.info(f"Cliente Supabase: {supabase_client}")

        return ClipSelectionService(supabase_client)

    except Exception as e:
        logger.error(f"❌ Error creando servicio de selección de clips: {e}")
        return None


# Instancia singleton del servicio
clip_selection_service = create_clip_selection_service()
