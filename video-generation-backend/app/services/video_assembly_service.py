"""
Servicio de ensamblaje de video usando FFmpeg

Este servicio combina audio, clips de video y subtítulos para crear el video final
"""

import os
import uuid
import logging
import tempfile
import asyncio
import subprocess
import base64
from typing import Dict, List, Optional, Any
from supabase import Client
from pathlib import Path

logger = logging.getLogger(__name__)


class VideoAssemblyService:
    """
    Servicio para ensamblar videos combinando audio, clips y subtítulos
    """

    def __init__(self, supabase_client: Client):
        """
        Inicializa el servicio con cliente de Supabase

        Args:
            supabase_client: Cliente configurado de Supabase
        """
        self.supabase = supabase_client
        self.temp_dir = tempfile.mkdtemp(prefix="video_assembly_")
        self.videos_cache: Dict[str, str] = {}
        self.bucket_name = 'generated-content'

        # Asegurar que el bucket existe
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Asegura que el bucket de storage existe"""
        try:
            # Intentar listar el bucket
            self.supabase.storage.list_buckets()

            # Verificar si nuestro bucket específico existe
            buckets = self.supabase.storage.list_buckets()
            bucket_exists = any(
                bucket['name'] == self.bucket_name for bucket in buckets)

            if not bucket_exists:
                # Crear bucket si no existe
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={'public': True}
                )
                logger.info(f"✅ Bucket '{self.bucket_name}' creado")
            else:
                logger.info(f"✅ Bucket '{self.bucket_name}' ya existe")

        except Exception as e:
            logger.warning(f"⚠️ No se pudo verificar/crear bucket: {e}")

    async def assemble_video(
        self,
        script_metadata: Dict[str, Any],
        user_id: Optional[str] = None,
        title: str = "Video Generado"
    ) -> Dict[str, Any]:
        """
        Ensambla un video completo desde audio y clips

        Args:
            script_metadata: Datos completos del script con audio y clips
            user_id: ID del usuario (opcional)
            title: Título del video

        Returns:
            Dict con información del video generado
        """
        video_id = str(uuid.uuid4())
        logger.info(f"🎬 Iniciando ensamblaje de video {video_id}")

        try:
            # 1. Preparar archivos temporales
            audio_path = await self._prepare_audio_file(script_metadata['audio_data'])
            clips_paths = await self._download_clips(script_metadata['clips_data'])

            # 2. Generar subtítulos
            subtitles_path = await self._generate_subtitles(
                script_metadata['segmentos'],
                script_metadata['audio_data']['duration']
            )

            # 3. Calcular timing y secuencia de clips
            # NUEVO: Usar timeline assignments si están disponibles
            if 'timeline_assignments' in script_metadata.get('clips_data', {}):
                clip_sequence = self._calculate_temporal_sequence(
                    clips_paths,
                    script_metadata['clips_data']['timeline_assignments'],
                    script_metadata['audio_data']['duration']
                )
            else:
                # Fallback al método anterior
                clip_sequence = self._calculate_clip_timing(
                    clips_paths,
                    script_metadata['audio_data']['duration']
                )

            # 4. Ensamblar video con FFmpeg
            output_path = await self._assemble_with_ffmpeg(
                audio_path=audio_path,
                clip_sequence=clip_sequence,
                subtitles_path=subtitles_path,
                video_id=video_id,
                audio_duration=script_metadata['audio_data']['duration']
            )

            # 5. Subir a Supabase Storage
            video_url = await self._upload_to_storage(output_path, video_id)

            # 6. Generar thumbnail
            thumbnail_url = await self._generate_thumbnail(output_path, video_id)

            # 7. Obtener metadatos del archivo
            file_stats = os.stat(output_path)
            duration = script_metadata['audio_data']['duration']

            # 8. Guardar info en caché para download
            self.videos_cache[video_id] = output_path

            logger.info(f"✅ Video {video_id} ensamblado exitosamente")

            return {
                'video_id': video_id,
                'video_url': video_url,
                'thumbnail_url': thumbnail_url,
                'duration': duration,
                'file_size': file_stats.st_size,
                'title': title,
                'user_id': user_id
            }

        except Exception as e:
            logger.error(f"❌ Error ensamblando video {video_id}: {e}")
            raise

    async def _prepare_audio_file(self, audio_data: Dict) -> str:
        """Prepara el archivo de audio desde base64"""
        audio_path = os.path.join(self.temp_dir, f"audio_{uuid.uuid4()}.mp3")

        # Decodificar base64 y guardar
        audio_bytes = base64.b64decode(audio_data['audio_base64'])
        with open(audio_path, 'wb') as f:
            f.write(audio_bytes)

        logger.info(f"📁 Audio preparado: {audio_path}")
        return audio_path

    async def _download_clips(self, clips_data: Dict) -> List[Dict]:
        """Descarga clips desde URLs y retorna rutas locales"""
        clips_paths = []

        for i, clip in enumerate(clips_data['selected_clips']):
            # Descargar clip
            clip_path = await self._download_single_clip(clip['file_url'], i)

            clips_paths.append({
                'path': clip_path,
                'duration': clip['duration'],
                'segment_type': clip['segment_type'],
                'original_duration': clip['duration']
            })

        logger.info(f"📥 Descargados {len(clips_paths)} clips")
        return clips_paths

    async def _download_single_clip(self, url: str, index: int) -> str:
        """Descarga un clip individual"""
        clip_path = os.path.join(
            self.temp_dir, f"clip_{index}_{uuid.uuid4()}.mp4")

        # Usar curl para descargar (más confiable que requests para videos grandes)
        process = await asyncio.create_subprocess_exec(
            'curl', '-L', '-o', clip_path, url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        await process.communicate()

        if not os.path.exists(clip_path) or os.path.getsize(clip_path) == 0:
            raise Exception(f"Error descargando clip desde {url}")

        return clip_path

    async def _generate_subtitles(self, segmentos: List[Dict], total_duration: float) -> str:
        """Genera archivo de subtítulos SRT"""
        subtitles_path = os.path.join(
            self.temp_dir, f"subtitles_{uuid.uuid4()}.srt")

        # Calcular timing de subtítulos basado en segmentos
        current_time = 0
        subtitle_entries = []

        for i, segmento in enumerate(segmentos):
            start_time = current_time
            end_time = min(current_time + segmento['duracion'], total_duration)

            # Formato SRT
            start_srt = self._seconds_to_srt_time(start_time)
            end_srt = self._seconds_to_srt_time(end_time)

            subtitle_entries.append(f"{i + 1}")
            subtitle_entries.append(f"{start_srt} --> {end_srt}")
            subtitle_entries.append(segmento['texto'])
            subtitle_entries.append("")  # Línea vacía entre entradas

            current_time = end_time

        # Escribir archivo SRT
        with open(subtitles_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(subtitle_entries))

        logger.info(f"📝 Subtítulos generados: {subtitles_path}")
        return subtitles_path

    def _seconds_to_srt_time(self, seconds: float) -> str:
        """Convierte segundos a formato SRT (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def _calculate_clip_timing(self, clips_paths: List[Dict], audio_duration: float) -> List[Dict]:
        """Calcula el timing y duración de cada clip para cubrir el audio"""
        total_clips_duration = sum(clip['duration'] for clip in clips_paths)

        if total_clips_duration <= audio_duration:
            # Necesitamos repetir o extender clips
            sequence = self._extend_clips_to_duration(
                clips_paths, audio_duration)
        else:
            # Necesitamos recortar clips
            sequence = self._trim_clips_to_duration(
                clips_paths, audio_duration)

        logger.info(
            f"⏱️ Secuencia calculada: {len(sequence)} clips para {audio_duration}s")
        return sequence

    def _extend_clips_to_duration(self, clips_paths: List[Dict], target_duration: float) -> List[Dict]:
        """Extiende la secuencia de clips para cubrir la duración objetivo"""
        sequence = []
        current_time = 0
        clip_index = 0

        while current_time < target_duration:
            clip = clips_paths[clip_index % len(clips_paths)]
            remaining_time = target_duration - current_time

            # Usar duración completa del clip o el tiempo restante
            clip_duration = min(clip['duration'], remaining_time)

            sequence.append({
                'path': clip['path'],
                'start_time': current_time,
                'duration': clip_duration,
                'segment_type': clip['segment_type']
            })

            current_time += clip_duration
            clip_index += 1

        return sequence

    def _trim_clips_to_duration(self, clips_paths: List[Dict], target_duration: float) -> List[Dict]:
        """Recorta la secuencia de clips para ajustarse a la duración objetivo"""
        sequence = []
        current_time = 0

        for clip in clips_paths:
            if current_time >= target_duration:
                break

            remaining_time = target_duration - current_time
            clip_duration = min(clip['duration'], remaining_time)

            sequence.append({
                'path': clip['path'],
                'start_time': current_time,
                'duration': clip_duration,
                'segment_type': clip['segment_type']
            })

            current_time += clip_duration

        return sequence

    def _calculate_temporal_sequence(
        self,
        clips_paths: List[Dict],
        timeline_assignments: List[Dict],
        audio_duration: float
    ) -> List[Dict]:
        """
        NUEVO: Calcula secuencia temporal usando timeline assignments precisos
        """
        logger.info(f"🕒 Calculando secuencia temporal con {len(timeline_assignments)} assignments")

        sequence = []

        # Crear mapa de clips por clip_id para encontrar rutas locales
        clips_map = {}
        for clip_path_info in clips_paths:
            # Intentar matchear por filename o características
            for assignment in timeline_assignments:
                clip_filename = assignment.get('clip', {}).get('filename', '')
                if clip_filename and clip_filename in clip_path_info.get('path', ''):
                    clips_map[assignment['clip']['id']] = clip_path_info
                    break

        # Ordenar assignments por start_time
        sorted_assignments = sorted(timeline_assignments, key=lambda x: x.get('start_time', 0))

        current_time = 0.0

        for assignment in sorted_assignments:
            start_time = assignment.get('start_time', current_time)
            end_time = assignment.get('end_time', start_time + 1.0)
            clip_duration = end_time - start_time
            clip_role = assignment.get('clip_role', 'main')

            # Buscar el clip correspondiente
            clip_id = assignment['clip']['id']
            clip_path_info = clips_map.get(clip_id)

            if not clip_path_info:
                logger.warning(f"⚠️ No se encontró clip local para assignment {clip_id}")
                # Usar primer clip disponible como fallback
                clip_path_info = clips_paths[0] if clips_paths else None

            if not clip_path_info:
                continue

            # Agregar gaps si es necesario
            if start_time > current_time:
                gap_duration = start_time - current_time
                if gap_duration > 0.1:  # Solo para gaps significativos
                    logger.info(f"⏸️ Gap detectado: {current_time:.1f}s-{start_time:.1f}s ({gap_duration:.1f}s)")
                    # Llenar gap con el último clip disponible o clip anterior
                    if sequence:
                        last_clip = sequence[-1]
                        sequence.append({
                            'path': last_clip['path'],
                            'start_time': current_time,
                            'duration': gap_duration,
                            'segment_type': 'filler',
                            'clip_role': 'filler'
                        })
                    current_time = start_time

            # Agregar clip principal
            sequence.append({
                'path': clip_path_info['path'],
                'start_time': start_time,
                'duration': clip_duration,
                'segment_type': assignment['segment']['type'],
                'clip_role': clip_role,
                'original_duration': clip_path_info.get('duration', clip_duration)
            })

            current_time = end_time

            logger.debug(f"   📍 {clip_role}: {start_time:.1f}s-{end_time:.1f}s ({clip_duration:.1f}s)")

        # Llenar el tiempo restante si es necesario
        if current_time < audio_duration:
            remaining_time = audio_duration - current_time
            logger.info(f"🔄 Llenando tiempo restante: {remaining_time:.1f}s")

            if sequence and remaining_time > 0.1:
                # Repetir último clip para llenar
                last_clip = sequence[-1]
                sequence.append({
                    'path': last_clip['path'],
                    'start_time': current_time,
                    'duration': remaining_time,
                    'segment_type': 'filler',
                    'clip_role': 'filler',
                    'original_duration': last_clip.get('original_duration', remaining_time)
                })

        total_duration = sum(clip['duration'] for clip in sequence)
        logger.info(f"✅ Secuencia temporal: {len(sequence)} clips, {total_duration:.1f}s total")

        return sequence

    async def _assemble_with_ffmpeg(
        self,
        audio_path: str,
        clip_sequence: List[Dict],
        subtitles_path: str,
        video_id: str,
        audio_duration: float
    ) -> str:
        """Ensambla el video final usando FFmpeg"""
        output_path = os.path.join(self.temp_dir, f"video_{video_id}.mp4")

        # Crear archivo de concatenación para FFmpeg
        concat_file = os.path.join(self.temp_dir, f"concat_{video_id}.txt")
        await self._create_concat_file(clip_sequence, concat_file)

        # Comando FFmpeg para ensamblar video
        ffmpeg_cmd = [
            'ffmpeg', '-y',  # Sobrescribir archivos existentes
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,  # Lista de clips de video
            '-i', audio_path,   # Audio
            '-i', subtitles_path,  # Subtítulos
            '-c:v', 'libx264',  # Codec de video
            '-c:a', 'aac',      # Codec de audio
            '-c:s', 'mov_text',  # Codec de subtítulos
            # REMOVIDO: '-shortest' - Ahora el video debe durar exactamente lo que el audio
            '-vf', 'scale=1080:1920,fps=30',  # Formato vertical 9:16, 30fps
            '-b:v', '2M',       # Bitrate de video
            '-b:a', '128k',     # Bitrate de audio
            '-preset', 'fast',  # Preset de encoding
            '-t', str(audio_duration),  # NUEVO: Duración exacta del audio
            output_path
        ]

        logger.info(f"🎬 Ejecutando FFmpeg para video {video_id}")

        # Ejecutar FFmpeg
        process = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Error desconocido en FFmpeg"
            logger.error(f"❌ FFmpeg falló: {error_msg}")
            raise Exception(f"Error en FFmpeg: {error_msg}")

        if not os.path.exists(output_path):
            raise Exception("FFmpeg no generó el archivo de salida")

        logger.info(f"✅ Video ensamblado con FFmpeg: {output_path}")
        return output_path

    async def _create_concat_file(self, clip_sequence: List[Dict], concat_file: str):
        """Crea archivo de concatenación para FFmpeg con transiciones mejoradas"""

        # Verificar si hay clips de transición para usar crossfade
        has_transitions = any(clip.get('clip_role') == 'transition' for clip in clip_sequence)

        if has_transitions:
            # Para clips con transiciones, crear archivo de concatenación avanzado
            await self._create_advanced_concat_file(clip_sequence, concat_file)
        else:
            # Método simple para retrocompatibilidad
            with open(concat_file, 'w') as f:
                for clip in clip_sequence:
                    # FFmpeg concat format
                    f.write(f"file '{clip['path']}'\n")
                    if clip['duration'] < clip.get('original_duration', clip['duration']):
                        # Si necesitamos recortar el clip
                        f.write(f"duration {clip['duration']}\n")

    async def _create_advanced_concat_file(self, clip_sequence: List[Dict], concat_file: str):
        """
        Crea archivo de concatenación con transiciones suaves usando crossfade
        """
        logger.info("🎬 Creando secuencia con transiciones crossfade")

        with open(concat_file, 'w') as f:
            previous_clip = None

            for i, clip in enumerate(clip_sequence):
                clip_role = clip.get('clip_role', 'main')

                if clip_role == 'transition' and previous_clip:
                    # Para clips de transición, aplicar crossfade con el clip anterior
                    logger.debug(f"   🔄 Transición crossfade: {previous_clip['segment_type']} → {clip['segment_type']}")

                    # Clip anterior con fade out
                    f.write(f"file '{previous_clip['path']}'\n")
                    if previous_clip['duration'] < previous_clip.get('original_duration', previous_clip['duration']):
                        f.write(f"duration {previous_clip['duration']}\n")

                    # Clip de transición con crossfade
                    f.write(f"file '{clip['path']}'\n")
                    if clip['duration'] < clip.get('original_duration', clip['duration']):
                        f.write(f"duration {clip['duration']}\n")

                else:
                    # Clip normal
                    f.write(f"file '{clip['path']}'\n")
                    if clip['duration'] < clip.get('original_duration', clip['duration']):
                        f.write(f"duration {clip['duration']}\n")

                previous_clip = clip if clip_role != 'transition' else previous_clip

    async def _upload_to_storage(self, video_path: str, video_id: str) -> str:
        """Sube el video a Supabase Storage"""
        file_name = f"videos/{video_id}.mp4"

        try:
            # Leer archivo
            with open(video_path, 'rb') as f:
                video_data = f.read()

            # Subir a Supabase
            result = self.supabase.storage.from_(self.bucket_name).upload(
                file_name,
                video_data,
                file_options={'content-type': 'video/mp4'},
            )

            # Obtener URL pública
            url_result = self.supabase.storage.from_(
                self.bucket_name).get_public_url(file_name)

            logger.info(f"☁️ Video subido a storage: {url_result}")
            return url_result

        except Exception as e:
            logger.error(f"❌ Error subiendo video a storage: {e}")
            raise

    async def _generate_thumbnail(self, video_path: str, video_id: str) -> Optional[str]:
        """Genera thumbnail del video"""
        try:
            thumbnail_path = os.path.join(
                self.temp_dir, f"thumb_{video_id}.jpg")

            # Comando FFmpeg para thumbnail
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-i', video_path,
                '-vf', 'scale=405:720',  # Mantener ratio 9:16
                '-vframes', '1',  # Solo un frame
                '-q:v', '2',      # Alta calidad
                thumbnail_path
            ]

            process = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await process.communicate()

            if os.path.exists(thumbnail_path):
                # Subir thumbnail a storage
                file_name = f"thumbnails/{video_id}.jpg"

                with open(thumbnail_path, 'rb') as f:
                    thumb_data = f.read()

                self.supabase.storage.from_(self.bucket_name).upload(
                    file_name,
                    thumb_data,
                    file_options={'content-type': 'image/jpeg'}
                )

                url_result = self.supabase.storage.from_(
                    self.bucket_name).get_public_url(file_name)
                logger.info(f"🖼️ Thumbnail generado: {url_result}")
                return url_result

        except Exception as e:
            logger.warning(f"⚠️ No se pudo generar thumbnail: {e}")

        return None

    async def get_video_file_path(self, video_id: str) -> Optional[str]:
        """Obtiene la ruta local del archivo de video para descarga"""
        return self.videos_cache.get(video_id)

    def cleanup_temp_files(self):
        """Limpia archivos temporales"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            logger.info(f"🧹 Archivos temporales limpiados: {self.temp_dir}")
        except Exception as e:
            logger.warning(f"⚠️ Error limpiando archivos temporales: {e}")
