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

        # Verificar propiedades del clip con FFprobe
        await self._verify_clip_properties(clip_path, index)

        return clip_path

    async def _verify_clip_properties(self, clip_path: str, index: int) -> Dict[str, Any]:
        """Verifica las propiedades del clip usando FFprobe"""
        try:
            ffprobe_cmd = [
                'ffprobe', '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                clip_path
            ]

            process = await asyncio.create_subprocess_exec(
                *ffprobe_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.warning(f"⚠️ FFprobe falló para clip {index}: {stderr.decode()}")
                return {}

            import json
            probe_data = json.loads(stdout.decode())

            # Extraer información del stream de video
            video_stream = None
            for stream in probe_data.get('streams', []):
                if stream.get('codec_type') == 'video':
                    video_stream = stream
                    break

            if video_stream:
                properties = {
                    'codec': video_stream.get('codec_name'),
                    'width': video_stream.get('width'),
                    'height': video_stream.get('height'),
                    'fps': eval(video_stream.get('r_frame_rate', '30/1')),
                    'duration': float(probe_data.get('format', {}).get('duration', 0))
                }

                logger.info(f"📊 Clip {index} - Codec: {properties['codec']}, "
                          f"Resolución: {properties['width']}x{properties['height']}, "
                          f"FPS: {properties['fps']:.2f}, Duración: {properties['duration']:.2f}s")

                return properties
            else:
                logger.warning(f"⚠️ No se encontró stream de video en clip {index}")
                return {}

        except Exception as e:
            logger.warning(f"⚠️ Error verificando propiedades del clip {index}: {e}")
            return {}

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
        if not clips_paths:
            raise Exception("No hay clips disponibles para el video")

        total_clips_duration = sum(clip['duration'] for clip in clips_paths)
        logger.info(f"📊 Duración total clips: {total_clips_duration}s, Audio: {audio_duration}s")

        if total_clips_duration <= audio_duration:
            # Necesitamos repetir o extender clips
            sequence = self._extend_clips_to_duration(clips_paths, audio_duration)
        else:
            # Necesitamos recortar clips
            sequence = self._trim_clips_to_duration(clips_paths, audio_duration)

        # Asegurar que tenemos al menos un clip y verificar duración mínima
        if not sequence:
            # Usar el primer clip como fallback
            sequence = [{
                'path': clips_paths[0]['path'],
                'start_time': 0,
                'duration': min(clips_paths[0]['duration'], audio_duration),
                'segment_type': clips_paths[0]['segment_type']
            }]

        logger.info(f"⏱️ Secuencia calculada: {len(sequence)} clips para {audio_duration}s")
        for i, clip in enumerate(sequence):
            logger.info(f"  Clip {i+1}: {clip['duration']}s en {clip['start_time']}s")

        return sequence

    def _extend_clips_to_duration(self, clips_paths: List[Dict], target_duration: float) -> List[Dict]:
        """Extiende la secuencia de clips para cubrir la duración objetivo"""
        sequence = []
        current_time = 0
        clip_index = 0

        # Calcular duración óptima por clip para mejor distribución
        # Intentar usar cada clip al menos una vez antes de repetir
        min_clips_needed = max(len(clips_paths), int(target_duration / 6))  # Al menos 1 clip cada 6s
        avg_clip_duration = target_duration / min_clips_needed
        avg_clip_duration = min(avg_clip_duration, 6.0)  # Max 6s por clip para más variedad

        # Crear una secuencia que use todos los clips al menos una vez
        clips_used = set()

        while current_time < target_duration:
            # Si no hemos usado todos los clips, usar uno nuevo
            if len(clips_used) < len(clips_paths):
                # Buscar el siguiente clip no usado
                while clip_index % len(clips_paths) in clips_used:
                    clip_index += 1
                current_clip_idx = clip_index % len(clips_paths)
                clips_used.add(current_clip_idx)
            else:
                # Ya usamos todos, ahora podemos repetir de forma cíclica
                current_clip_idx = clip_index % len(clips_paths)

            clip = clips_paths[current_clip_idx]
            remaining_time = target_duration - current_time

            # Calcular duración para este clip
            if remaining_time > avg_clip_duration:
                clip_duration = min(clip['duration'], avg_clip_duration)
            else:
                clip_duration = remaining_time

            # Duración mínima de 1.5 segundos para que se vean bien
            clip_duration = max(clip_duration, min(1.5, remaining_time))

            sequence.append({
                'path': clip['path'],
                'start_time': current_time,
                'duration': clip_duration,
                'segment_type': clip['segment_type'],
                'clip_index': current_clip_idx  # Para tracking
            })

            current_time += clip_duration
            clip_index += 1

            # Evitar loop infinito
            if clip_index > len(clips_paths) * 20:
                break

        # Log de la distribución de clips
        clip_count = {}
        for seq_clip in sequence:
            idx = seq_clip.get('clip_index', 'unknown')
            clip_count[idx] = clip_count.get(idx, 0) + 1

        logger.info(f"🎬 Distribución de clips: {clip_count}")
        return sequence

    def _trim_clips_to_duration(self, clips_paths: List[Dict], target_duration: float) -> List[Dict]:
        """Recorta la secuencia de clips para ajustarse a la duración objetivo"""
        sequence = []
        current_time = 0

        # Calcular duración óptima por clip para usar múltiples clips
        optimal_clip_duration = min(target_duration / len(clips_paths), 6.0)  # Max 6s por clip

        for i, clip in enumerate(clips_paths):
            if current_time >= target_duration:
                break

            remaining_time = target_duration - current_time

            # Usar duración óptima o restante, lo que sea menor
            if remaining_time > optimal_clip_duration and i < len(clips_paths) - 1:
                clip_duration = min(clip['duration'], optimal_clip_duration)
            else:
                clip_duration = min(clip['duration'], remaining_time)

            # Duración mínima de 1.5 segundos si queda tiempo suficiente
            if remaining_time >= 1.5:
                clip_duration = max(clip_duration, 1.5)

            sequence.append({
                'path': clip['path'],
                'start_time': current_time,
                'duration': clip_duration,
                'segment_type': clip['segment_type'],
                'clip_index': i  # Para tracking
            })

            current_time += clip_duration

        # Log de la distribución de clips
        logger.info(f"🎬 Clips usados en trim: {len(sequence)} clips únicos")
        for i, seq_clip in enumerate(sequence):
            logger.info(f"  Clip {seq_clip.get('clip_index', i)}: {seq_clip['duration']}s")

        return sequence

    async def _assemble_with_ffmpeg(
        self,
        audio_path: str,
        clip_sequence: List[Dict],
        subtitles_path: str,
        video_id: str,
        audio_duration: float
    ) -> str:
        """Ensambla el video final usando FFmpeg con normalización completa"""
        output_path = os.path.join(self.temp_dir, f"video_{video_id}.mp4")

        # Validar archivos de entrada antes de FFmpeg
        if not os.path.exists(audio_path):
            raise Exception(f"Archivo de audio no encontrado: {audio_path}")

        for i, clip in enumerate(clip_sequence):
            if not os.path.exists(clip['path']):
                raise Exception(f"Clip {i+1} no encontrado: {clip['path']}")
            clip_size = os.path.getsize(clip['path'])
            if clip_size == 0:
                raise Exception(f"Clip {i+1} está vacío: {clip['path']}")
            logger.info(f"✅ Clip {i+1} válido: {clip_size} bytes")

        # NUEVO: Usar método robusto con re-encoding y normalización
        return await self._assemble_with_normalization(
            audio_path, clip_sequence, video_id, audio_duration
        )

    async def _assemble_with_normalization(
        self,
        audio_path: str,
        clip_sequence: List[Dict],
        video_id: str,
        audio_duration: float
    ) -> str:
        """Método robusto que normaliza todos los clips antes de concatenar"""
        output_path = os.path.join(self.temp_dir, f"video_{video_id}.mp4")

        logger.info(f"🎬 Iniciando ensamblaje con normalización para {len(clip_sequence)} clips")

        # PASO 1: Normalizar todos los clips individualmente
        normalized_clips = await self._normalize_all_clips(clip_sequence, video_id)

        # PASO 2: Crear archivo de concatenación con clips normalizados
        concat_file = os.path.join(self.temp_dir, f"concat_normalized_{video_id}.txt")
        await self._create_concat_file_normalized(normalized_clips, concat_file)

        # PASO 3: Concatenar clips normalizados (ahora SÍ podemos usar copy)
        if len(normalized_clips) == 1:
            # Un solo clip - comando directo
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-i', normalized_clips[0]['path'],
                '-i', audio_path,
                '-c:v', 'copy',  # Ahora SÍ podemos usar copy porque está normalizado
                '-c:a', 'aac',
                '-b:a', '96k',   # Audio comprimido
                '-ac', '2',
                '-ar', '44100',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-movflags', '+faststart',
                '-t', str(audio_duration),
                output_path
            ]
            logger.info("🎯 Concatenando 1 clip normalizado")
        else:
            # Múltiples clips normalizados - concatenación segura
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-i', audio_path,
                '-c:v', 'copy',  # Ahora es seguro porque todos tienen mismo formato
                '-c:a', 'aac',
                '-b:a', '96k',   # Audio comprimido para ahorrar espacio
                '-ac', '2',      # Estereo
                '-ar', '44100',  # Sample rate estándar
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-movflags', '+faststart',  # Optimizar para streaming
                '-t', str(audio_duration),
                output_path
            ]
            logger.info(f"🔗 Concatenando {len(normalized_clips)} clips normalizados")

        logger.info(f"📋 Comando final: {' '.join(ffmpeg_cmd)}")

        # Ejecutar FFmpeg con manejo robusto de errores
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            # Timeout de 3 minutos para concatenación
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=180.0
            )

        except asyncio.TimeoutError:
            logger.error("❌ FFmpeg timeout después de 3 minutos")
            process.kill()
            await process.wait()
            raise Exception("FFmpeg timeout - el proceso tomó demasiado tiempo")

        # Log detallado del output para debugging
        if stdout:
            stdout_text = stdout.decode('utf-8', errors='replace')
            logger.info(f"📋 FFmpeg stdout: {stdout_text[:1000]}...")

        if stderr:
            stderr_text = stderr.decode('utf-8', errors='replace')
            logger.info(f"📋 FFmpeg stderr: {stderr_text[:1000]}...")

            # Detectar warnings específicos
            if "different codec" in stderr_text.lower():
                logger.warning("⚠️ Detectados diferentes codecs en clips")
            if "different resolution" in stderr_text.lower():
                logger.warning("⚠️ Detectadas diferentes resoluciones en clips")

        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Error desconocido en FFmpeg"
            logger.error(f"❌ FFmpeg falló con código {process.returncode}")
            logger.error(f"❌ Error completo: {error_msg}")

            # Si falla la concatenación, intentar fallback con re-encoding
            if len(clip_sequence) > 1 and "concat" in error_msg.lower():
                logger.warning("🔄 Concatenación falló, intentando con re-encoding completo...")
                return await self._fallback_with_reencoding(
                    audio_path, clip_sequence, video_id, audio_duration
                )

            raise Exception(f"Error en FFmpeg (código {process.returncode}): {error_msg}")

        if not os.path.exists(output_path):
            raise Exception("FFmpeg no generó el archivo de salida")

        # Verificar tamaño del archivo
        file_size = os.path.getsize(output_path)
        logger.info(f"✅ Video ensamblado exitosamente: {output_path} ({file_size:,} bytes)")

        if file_size == 0:
            raise Exception("El archivo de video generado está vacío")

        return output_path

    async def _normalize_all_clips(
        self,
        clip_sequence: List[Dict],
        video_id: str
    ) -> List[Dict]:
        """Normaliza todos los clips a un formato común"""
        normalized_clips = []

        # Parámetros de normalización optimizados para tamaño
        target_params = {
            'width': 1080,
            'height': 1920,
            'fps': 30,
            'codec': 'libx264',
            'preset': 'fast',  # Mejor compresión que ultrafast
            'crf': 28,  # Compresión más agresiva (era 23)
            'profile': 'main',
            'level': '4.0'
        }

        logger.info(f"🔧 Normalizando {len(clip_sequence)} clips a formato estándar...")

        for i, clip in enumerate(clip_sequence):
            normalized_path = os.path.join(
                self.temp_dir,
                f"normalized_{video_id}_{i}.mp4"
            )

            # Comando de normalización optimizado para tamaño
            normalize_cmd = [
                'ffmpeg', '-y',
                '-i', clip['path'],
                '-c:v', target_params['codec'],
                '-preset', target_params['preset'],
                '-crf', str(target_params['crf']),
                '-profile:v', target_params['profile'],
                '-level:v', target_params['level'],
                '-vf', f"scale={target_params['width']}:{target_params['height']}:force_original_aspect_ratio=decrease,pad={target_params['width']}:{target_params['height']}:(ow-iw)/2:(oh-ih)/2,fps={target_params['fps']}",
                '-an',  # Sin audio en clips individuales
                '-maxrate', '1.5M',  # Limitar bitrate máximo
                '-bufsize', '3M',    # Buffer size
                '-g', '60',          # GOP size (keyframe cada 2 segundos a 30fps)
                '-t', str(clip['duration']),
                normalized_path
            ]

            logger.info(f"🔧 Normalizando clip {i+1}/{len(clip_sequence)}...")

            try:
                process = await asyncio.create_subprocess_exec(
                    *normalize_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=60.0  # 1 minuto por clip
                )

                if process.returncode != 0:
                    error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Error desconocido"
                    logger.error(f"❌ Error normalizando clip {i+1}: {error_msg}")
                    # Usar clip original como fallback
                    normalized_path = clip['path']
                    logger.warning(f"⚠️ Usando clip original {i+1} sin normalizar")

                elif not os.path.exists(normalized_path) or os.path.getsize(normalized_path) == 0:
                    logger.warning(f"⚠️ Clip normalizado {i+1} vacío, usando original")
                    normalized_path = clip['path']
                else:
                    size = os.path.getsize(normalized_path)
                    logger.info(f"✅ Clip {i+1} normalizado: {size:,} bytes")

            except asyncio.TimeoutError:
                logger.error(f"❌ Timeout normalizando clip {i+1}, usando original")
                normalized_path = clip['path']
            except Exception as e:
                logger.error(f"❌ Error inesperado normalizando clip {i+1}: {e}")
                normalized_path = clip['path']

            # Agregar clip normalizado a la secuencia
            normalized_clips.append({
                'path': normalized_path,
                'duration': clip['duration'],
                'start_time': clip['start_time'],
                'segment_type': clip.get('segment_type', 'unknown'),
                'normalized': normalized_path != clip['path']
            })

        normalized_count = sum(1 for clip in normalized_clips if clip.get('normalized', False))
        logger.info(f"✅ Normalización completada: {normalized_count}/{len(clip_sequence)} clips normalizados")

        return normalized_clips

    async def _create_concat_file_normalized(self, normalized_clips: List[Dict], concat_file: str):
        """Crea archivo de concatenación optimizado para clips normalizados"""
        with open(concat_file, 'w') as f:
            for i, clip in enumerate(normalized_clips):
                abs_path = os.path.abspath(clip['path'])
                # Escapar caracteres especiales en el path
                escaped_path = abs_path.replace("'", "'\\''")
                f.write(f"file '{escaped_path}'\n")

                # Para clips normalizados, especificar duración explícitamente
                if i < len(normalized_clips) - 1:  # No en el último clip
                    f.write(f"duration {clip['duration']:.3f}\n")

                status = "✅ normalizado" if clip.get('normalized', False) else "⚠️ original"
                logger.info(f"📝 Clip {i+1}: {abs_path} - {clip['duration']:.2f}s ({status})")

        # Log del contenido del archivo para debug
        with open(concat_file, 'r') as f:
            content = f.read()
            logger.info(f"📝 Archivo concat normalizado:\n{content}")

    async def _fallback_with_reencoding(
        self,
        audio_path: str,
        clip_sequence: List[Dict],
        video_id: str,
        audio_duration: float
    ) -> str:
        """Método de fallback usando re-encoding completo con filtros complejos"""
        output_path = os.path.join(self.temp_dir, f"video_{video_id}_reencoded.mp4")

        logger.info(f"🆘 Ejecutando fallback con re-encoding completo para {len(clip_sequence)} clips")

        # Construir filtro complejo para concatenación con re-encoding
        filter_complex = []
        input_files = []

        # Agregar clips como inputs
        for i, clip in enumerate(clip_sequence):
            input_files.extend(['-i', clip['path']])

            # Normalizar cada input
            filter_complex.append(
                f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,"
                f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,settb=1/30[v{i}]"
            )

        # Agregar audio como último input
        input_files.extend(['-i', audio_path])
        audio_input_index = len(clip_sequence)

        # Concatenar todos los videos normalizados
        video_inputs = ''.join(f'[v{i}]' for i in range(len(clip_sequence)))
        filter_complex.append(f"{video_inputs}concat=n={len(clip_sequence)}:v=1:a=0[outv]")

        # Comando completo con compresión optimizada
        fallback_cmd = [
            'ffmpeg', '-y'
        ] + input_files + [
            '-filter_complex', ';'.join(filter_complex),
            '-map', '[outv]',
            '-map', f'{audio_input_index}:a',
            '-c:v', 'libx264',
            '-preset', 'fast',      # Mejor compresión
            '-crf', '30',           # Más compresión para emergencia
            '-maxrate', '1M',       # Bitrate límite
            '-bufsize', '2M',
            '-c:a', 'aac',
            '-b:a', '96k',
            '-ac', '2',
            '-ar', '44100',
            '-movflags', '+faststart',
            '-t', str(audio_duration),
            output_path
        ]

        logger.info(f"🆘 Comando fallback: {' '.join(fallback_cmd[:10])}... (truncado)")

        try:
            process = await asyncio.create_subprocess_exec(
                *fallback_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=300.0  # 5 minutos para re-encoding completo
            )

            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Error en fallback"
                logger.error(f"❌ Fallback con re-encoding falló: {error_msg}")

                # Último recurso: usar solo el primer clip
                logger.warning("🆘 Último recurso: usando solo el primer clip...")
                return await self._simple_video_fallback(
                    clip_sequence[0]['path'], audio_path, video_id, audio_duration
                )

            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise Exception("Fallback no generó archivo válido")

            file_size = os.path.getsize(output_path)
            logger.info(f"✅ Fallback exitoso: {output_path} ({file_size:,} bytes)")
            return output_path

        except asyncio.TimeoutError:
            logger.error("❌ Timeout en fallback con re-encoding")
            process.kill()
            await process.wait()

            # Último recurso
            return await self._simple_video_fallback(
                clip_sequence[0]['path'], audio_path, video_id, audio_duration
            )
        except Exception as e:
            logger.error(f"❌ Error en fallback con re-encoding: {e}")
            return await self._simple_video_fallback(
                clip_sequence[0]['path'], audio_path, video_id, audio_duration
            )

    async def _simple_video_fallback(
        self,
        clip_path: str,
        audio_path: str,
        video_id: str,
        audio_duration: float
    ) -> str:
        """Método de fallback simple usando solo un clip con máxima compatibilidad"""
        output_path = os.path.join(self.temp_dir, f"video_{video_id}_simple.mp4")

        # Comando ultra-simple y robusto con máxima compresión
        fallback_cmd = [
            'ffmpeg', '-y',
            '-i', clip_path,
            '-i', audio_path,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30',
            '-preset', 'fast',           # Mejor compresión
            '-crf', '32',                # Alta compresión para emergencia
            '-maxrate', '800k',          # Bitrate muy limitado
            '-bufsize', '1.6M',
            '-profile:v', 'main',
            '-level:v', '4.0',
            '-b:a', '96k',
            '-ac', '2',
            '-ar', '44100',
            '-movflags', '+faststart',
            '-t', str(audio_duration),
            output_path
        ]

        logger.info(f"🆘 Ejecutando fallback simple y robusto...")
        logger.info(f"📋 Comando: {' '.join(fallback_cmd)}")

        try:
            process = await asyncio.create_subprocess_exec(
                *fallback_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=120.0  # 2 minutos para fallback
            )

            # Log detallado del output
            if stdout:
                logger.info(f"📋 Fallback stdout: {stdout.decode('utf-8', errors='replace')[:500]}...")
            if stderr:
                stderr_text = stderr.decode('utf-8', errors='replace')
                logger.info(f"📋 Fallback stderr: {stderr_text[:500]}...")

            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Error en fallback simple"
                logger.error(f"❌ Fallback simple falló con código {process.returncode}")
                logger.error(f"❌ Error: {error_msg}")
                raise Exception(f"Fallback simple failed (código {process.returncode}): {error_msg}")

            if not os.path.exists(output_path):
                raise Exception("Fallback simple no generó archivo de salida")

            file_size = os.path.getsize(output_path)
            if file_size == 0:
                raise Exception("Fallback simple generó archivo vacío")

            logger.info(f"✅ Fallback simple exitoso: {output_path} ({file_size:,} bytes)")
            return output_path

        except asyncio.TimeoutError:
            logger.error("❌ Timeout en fallback simple después de 2 minutos")
            process.kill()
            await process.wait()
            raise Exception("Fallback simple timeout")
        except Exception as e:
            logger.error(f"❌ Error inesperado en fallback simple: {e}")
            raise

    async def _create_concat_file(self, clip_sequence: List[Dict], concat_file: str):
        """Crea archivo de concatenación para FFmpeg"""
        with open(concat_file, 'w') as f:
            for i, clip in enumerate(clip_sequence):
                # FFmpeg concat format con path absoluto
                abs_path = os.path.abspath(clip['path'])
                f.write(f"file '{abs_path}'\n")

                # Solo especificar duración si NO es el último clip
                # El último clip debe usar su duración natural
                if i < len(clip_sequence) - 1:
                    f.write(f"duration {clip['duration']}\n")

                # Log para debug
                logger.info(f"Clip {i+1}: {abs_path} - Duración: {clip['duration']}s")

        # Log del contenido del archivo para debug
        with open(concat_file, 'r') as f:
            content = f.read()
            logger.info(f"📝 Contenido del archivo concat:\n{content}")

    async def _upload_to_storage(self, video_path: str, video_id: str) -> str:
        """Sube el video a Supabase Storage con verificación de tamaño"""
        file_name = f"videos/{video_id}.mp4"
        max_size_mb = 50  # Límite de Supabase
        max_size_bytes = max_size_mb * 1024 * 1024

        try:
            # Verificar tamaño del archivo
            file_size = os.path.getsize(video_path)
            file_size_mb = file_size / (1024 * 1024)

            logger.info(f"📊 Tamaño del video: {file_size_mb:.2f}MB (límite: {max_size_mb}MB)")

            # Si excede el límite, comprimir más
            if file_size > max_size_bytes:
                logger.warning(f"⚠️ Video excede {max_size_mb}MB, aplicando compresión adicional...")
                compressed_path = await self._compress_video_for_upload(video_path, video_id, max_size_bytes)
                video_path = compressed_path

                # Verificar nuevo tamaño
                new_file_size = os.path.getsize(video_path)
                new_file_size_mb = new_file_size / (1024 * 1024)
                logger.info(f"📊 Nuevo tamaño después de compresión: {new_file_size_mb:.2f}MB")

                if new_file_size > max_size_bytes:
                    logger.error(f"❌ Video aún excede el límite después de compresión")
                    raise Exception(f"Video demasiado grande: {new_file_size_mb:.2f}MB > {max_size_mb}MB")

            # Leer archivo (ahora dentro del límite)
            with open(video_path, 'rb') as f:
                video_data = f.read()

            logger.info(f"☁️ Subiendo video de {len(video_data):,} bytes...")

            # Subir a Supabase
            result = self.supabase.storage.from_(self.bucket_name).upload(
                file_name,
                video_data,
                file_options={'content-type': 'video/mp4'},
            )

            # Obtener URL pública
            url_result = self.supabase.storage.from_(
                self.bucket_name).get_public_url(file_name)

            logger.info(f"✅ Video subido exitosamente a storage: {url_result}")
            return url_result

        except Exception as e:
            logger.error(f"❌ Error subiendo video a storage: {e}")
            raise

    async def _compress_video_for_upload(
        self,
        video_path: str,
        video_id: str,
        max_size_bytes: int
    ) -> str:
        """Comprime el video agresivamente para cumplir con el límite de tamaño"""
        compressed_path = os.path.join(self.temp_dir, f"compressed_{video_id}.mp4")

        logger.info(f"🗜️ Iniciando compresión agresiva del video...")

        # Obtener duración del video para calcular bitrate objetivo
        duration = await self._get_video_duration(video_path)
        if duration <= 0:
            duration = 60  # Fallback

        # Calcular bitrate objetivo (dejando margen para audio)
        target_size_mb = 45  # Margen de seguridad de 5MB
        target_bitrate_kbps = int((target_size_mb * 8 * 1024) / duration)  # kbps
        target_bitrate_kbps = max(target_bitrate_kbps, 300)  # Mínimo 300kbps
        target_bitrate_kbps = min(target_bitrate_kbps, 1500)  # Máximo 1.5Mbps

        logger.info(f"🎯 Bitrate objetivo: {target_bitrate_kbps}kbps para {duration:.1f}s")

        # Intentar 3 niveles de compresión progresivamente más agresivos
        compression_levels = [
            {
                'name': 'Compresión media',
                'crf': '30',
                'preset': 'fast',
                'maxrate': f'{target_bitrate_kbps}k',
                'bufsize': f'{target_bitrate_kbps * 2}k',
                'scale': '1080:1920'
            },
            {
                'name': 'Compresión alta',
                'crf': '33',
                'preset': 'medium',
                'maxrate': f'{int(target_bitrate_kbps * 0.8)}k',
                'bufsize': f'{int(target_bitrate_kbps * 1.6)}k',
                'scale': '1080:1920'
            },
            {
                'name': 'Compresión extrema',
                'crf': '36',
                'preset': 'slow',
                'maxrate': f'{int(target_bitrate_kbps * 0.6)}k',
                'bufsize': f'{int(target_bitrate_kbps * 1.2)}k',
                'scale': '864:1536'  # Resolución reducida
            }
        ]

        for i, level in enumerate(compression_levels):
            temp_compressed = os.path.join(self.temp_dir, f"temp_compressed_{video_id}_{i}.mp4")

            compress_cmd = [
                'ffmpeg', '-y',
                '-i', video_path,
                '-c:v', 'libx264',
                '-preset', level['preset'],
                '-crf', level['crf'],
                '-maxrate', level['maxrate'],
                '-bufsize', level['bufsize'],
                '-vf', f"scale={level['scale']}:force_original_aspect_ratio=decrease,pad={level['scale'].replace(':', 'x')}:(ow-iw)/2:(oh-ih)/2",
                '-c:a', 'aac',
                '-b:a', '64k',  # Audio muy comprimido
                '-ac', '2',
                '-ar', '44100',
                '-movflags', '+faststart',
                temp_compressed
            ]

            logger.info(f"🗜️ Probando {level['name']} (intento {i+1}/{len(compression_levels)})...")

            try:
                process = await asyncio.create_subprocess_exec(
                    *compress_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=300.0  # 5 minutos
                )

                if process.returncode == 0 and os.path.exists(temp_compressed):
                    compressed_size = os.path.getsize(temp_compressed)
                    compressed_mb = compressed_size / (1024 * 1024)

                    logger.info(f"✅ {level['name']} completada: {compressed_mb:.2f}MB")

                    if compressed_size <= max_size_bytes:
                        logger.info(f"✅ ¡Compresión exitosa! Tamaño final: {compressed_mb:.2f}MB")
                        # Mover archivo final
                        os.rename(temp_compressed, compressed_path)
                        return compressed_path
                    else:
                        logger.warning(f"⚠️ Aún excede el límite, probando siguiente nivel...")
                        os.remove(temp_compressed)
                else:
                    error_msg = stderr.decode('utf-8', errors='replace') if stderr else "Error desconocido"
                    logger.warning(f"⚠️ {level['name']} falló: {error_msg[:200]}...")

            except asyncio.TimeoutError:
                logger.warning(f"⚠️ Timeout en {level['name']}")
                process.kill()
                await process.wait()
            except Exception as e:
                logger.warning(f"⚠️ Error en {level['name']}: {e}")

            # Limpiar archivo temporal si existe
            if os.path.exists(temp_compressed):
                os.remove(temp_compressed)

        # Si todos los niveles fallaron, usar el original y esperar que Supabase dé error claro
        logger.error("❌ Todas las compresiones fallaron")
        raise Exception("No se pudo comprimir el video dentro del límite de tamaño")

    async def _get_video_duration(self, video_path: str) -> float:
        """Obtiene la duración del video usando FFprobe"""
        try:
            ffprobe_cmd = [
                'ffprobe', '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                video_path
            ]

            process = await asyncio.create_subprocess_exec(
                *ffprobe_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                import json
                probe_data = json.loads(stdout.decode())
                duration = float(probe_data.get('format', {}).get('duration', 0))
                logger.info(f"📉 Duración del video: {duration:.2f}s")
                return duration
            else:
                logger.warning(f"⚠️ Error obteniendo duración: {stderr.decode()}")
                return 0

        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo duración del video: {e}")
            return 0

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
