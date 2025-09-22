# enhanced_pexels_downloader.py - Crear metadatos de clips con OpenCV + embeddings all-mpnet-base-v2

import requests
import os
import time
import json
import cv2
import cv2.data
import numpy as np
from typing import Dict, List, Tuple
from sentence_transformers import SentenceTransformer

# Configuración
DOWNLOAD_FOLDER = "./clips"
DELAY_BETWEEN_DOWNLOADS = 1.5
TARGET_SIZE_TOTAL_MB = 1000
TARGET_SIZE_PER_CATEGORY_MB = 250
MIN_DURATION = 2  # Cambiado a 2s mínimo para Shorts
MAX_DURATION = 8  # Cambiado a 8s máximo para Shorts
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")


class YouTubeShortsMetadataExtractor:
    """Extrae metadatos específicamente útiles para generación de YouTube Shorts"""

    def __init__(self):
        # Cargar clasificadores de OpenCV
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml')
            self.smile_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_smile.xml')
        except:
            print("⚠️  OpenCV clasificadores no disponibles, usando análisis básico")
            self.face_cascade = None
            self.eye_cascade = None
            self.smile_cascade = None

        # Cargar modelo de embeddings
        try:
            print("🤖 Inicializando modelo de embeddings all-mpnet-base-v2...")
            self.embedding_model = SentenceTransformer('all-mpnet-base-v2')
            print("✅ Modelo de embeddings cargado - 768 dimensiones")
        except Exception as e:
            print(f"⚠️  Error cargando modelo de embeddings: {e}")
            self.embedding_model = None

    def extract_youtube_shorts_metadata(self, video_path: str, pexels_metadata: Dict) -> Dict:
        """Extrae metadatos específicos para YouTube Shorts AI generation"""

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "No se pudo analizar el video"}

        # Info técnica básica
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0

        # 🎯 ANÁLISIS PARA YOUTUBE SHORTS
        shorts_metadata = {
            # Metadatos base (mantener de Pexels)
            "basic_info": pexels_metadata,

            # 🎬 COMPATIBILIDAD CON SHORTS
            "shorts_compatibility": self._analyze_shorts_compatibility(width, height, duration),

            # 🧠 MATCHING INTELIGENTE PARA IA
            "ai_matching": self._extract_ai_matching_features(cap, frame_count),

            # 🎨 ESTILO VISUAL PARA TEMPLATES
            "visual_style": self._analyze_visual_style(cap, frame_count),

            # 📍 POSICIONAMIENTO EN VIDEO
            "positioning": self._analyze_positioning_potential(cap, frame_count),

            # 🔊 COMPATIBILIDAD DE AUDIO
            "audio_compatibility": self._analyze_audio_compatibility(duration),

            # 📊 SCORE DE UTILIDAD
            "utility_scores": {}
        }

        cap.release()

        # Calcular scores finales
        shorts_metadata["utility_scores"] = self._calculate_utility_scores(
            shorts_metadata)

        # 🧠 GENERAR EMBEDDINGS
        if self.embedding_model:
            try:
                # Preparar texto para embedding
                embedding_text = self.prepare_video_text_for_embedding(
                    pexels_metadata,
                    shorts_metadata["visual_style"],
                    shorts_metadata["ai_matching"]
                )

                # Generar embedding
                embedding = self.generate_video_embedding(embedding_text)

                if embedding:
                    shorts_metadata["embedding"] = {
                        "vector": embedding,
                        "dimensions": len(embedding),
                        "model": "all-mpnet-base-v2",
                        "text_source": embedding_text[:200] + "..." if len(embedding_text) > 200 else embedding_text
                    }
                else:
                    shorts_metadata["embedding"] = {}

            except Exception as e:
                print(f"    ⚠️  Error generando embedding: {e}")
                shorts_metadata["embedding"] = {}
        else:
            shorts_metadata["embedding"] = {}

        return shorts_metadata

    def _analyze_shorts_compatibility(self, width: int, height: int, duration: float) -> Dict:
        """Analiza qué tan compatible es el clip para YouTube Shorts"""

        aspect_ratio = width / height

        # YouTube Shorts prefiere 9:16, pero acepta otros
        shorts_orientation = "vertical" if aspect_ratio < 0.8 else (
            "square" if 0.8 <= aspect_ratio <= 1.2 else "horizontal")

        # Score de orientación (0-10)
        orientation_score = {
            "vertical": 10,    # Perfecto para Shorts
            "square": 7,       # Bueno, se puede adaptar
            "horizontal": 4    # Necesita cropping
        }.get(shorts_orientation, 0)

        # Score de duración (0-10)
        duration_score = 10 if 2 <= duration <= 15 else (
            8 if duration <= 30 else 5)

        return {
            "aspect_ratio": round(aspect_ratio, 2),
            "orientation": shorts_orientation,
            "orientation_score": orientation_score,
            "duration_score": duration_score,
            "is_vertical_friendly": aspect_ratio < 1.2,
            "needs_cropping": shorts_orientation == "horizontal"
        }

    def _extract_ai_matching_features(self, cap, frame_count: int) -> Dict:
        """Extrae características para matching inteligente con scripts de IA"""

        # Analizar frames clave
        key_frames = [0, frame_count//4, frame_count //
                      2, 3*frame_count//4, frame_count-1]

        scene_analysis = {
            "dominant_subjects": [],
            "text_presence": 0,
            "human_presence": 0,
            "object_focus": 0,
            "action_level": 0,
            "emotional_tone": "neutral"
        }

        motion_accumulator = []
        brightness_values = []
        prev_frame = None

        for frame_idx in key_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                continue

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # 1. DETECCIÓN DE PERSONAS (crucial para matching)
            if self.face_cascade is not None:
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                if len(faces) > 0:
                    scene_analysis["human_presence"] += 1

                    # Detectar sonrisas para tono emocional
                    if self.smile_cascade is not None:
                        for (x, y, w, h) in faces:
                            roi_gray = gray[y:y+h, x:x+w]
                            smiles = self.smile_cascade.detectMultiScale(
                                roi_gray, 1.8, 20)
                            if len(smiles) > 0:
                                scene_analysis["emotional_tone"] = "positive"

            # 2. DETECCIÓN DE TEXTO (para clips educativos/tech)
            # Usar análisis de bordes como proxy para detectar texto
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(
                edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # Contar contornos rectangulares pequeños (posible texto)
            text_candidates = 0
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                area = cv2.contourArea(contour)
                if 100 < area < 5000 and 2 < aspect_ratio < 8:  # Características típicas de texto
                    text_candidates += 1

            if text_candidates > 10:  # Muchos elementos tipo texto
                scene_analysis["text_presence"] += 1

            # 3. ANÁLISIS DE MOVIMIENTO
            if prev_frame is not None:
                diff = cv2.absdiff(prev_frame, gray)
                motion_intensity = np.mean(diff)
                motion_accumulator.append(motion_intensity)

            # 4. BRILLO PARA CONSISTENCIA
            brightness_values.append(np.mean(gray))

            prev_frame = gray.copy()

        # Procesar resultados
        avg_motion = np.mean(motion_accumulator) if motion_accumulator else 0
        scene_analysis["action_level"] = min(10, avg_motion / 10)  # Scale 0-10

        # Determinar tipo de contenido principal
        if scene_analysis["human_presence"] >= 3:
            scene_analysis["dominant_subjects"].append("people")
        if scene_analysis["text_presence"] >= 2:
            scene_analysis["dominant_subjects"].append("text_heavy")
        if avg_motion > 20:
            scene_analysis["dominant_subjects"].append("dynamic")
        elif avg_motion < 5:
            scene_analysis["dominant_subjects"].append("static")

        return scene_analysis

    def _analyze_visual_style(self, cap, frame_count: int) -> Dict:
        """Analiza el estilo visual para matching con templates"""

        # Analizar frame del medio
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count // 2)
        ret, frame = cap.read()

        if not ret:
            return {"error": "No se pudo analizar estilo"}

        # 1. PALETA DE COLORES DOMINANTES
        small_frame = cv2.resize(frame, (100, 100))
        pixels = small_frame.reshape(-1, 3)

        # K-means para colores dominantes
        from sklearn.cluster import KMeans
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(pixels)
        dominant_colors = kmeans.cluster_centers_.astype(int)

        # Convertir BGR a RGB
        rgb_colors = [(int(color[2]), int(color[1]), int(color[0]))
                      for color in dominant_colors]

        # 2. ANÁLISIS DE SATURACIÓN Y BRILLO
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        avg_saturation = np.mean(hsv_frame[:, :, 1])
        avg_brightness = np.mean(hsv_frame[:, :, 2])

        # 3. CLASIFICACIÓN DE ESTILO
        style_tags = []

        if avg_saturation > 120:
            style_tags.append("vibrant")
        elif avg_saturation < 60:
            style_tags.append("muted")

        if avg_brightness > 180:
            style_tags.append("bright")
        elif avg_brightness < 80:
            style_tags.append("dark")

        # 4. ANÁLISIS DE COMPLEJIDAD VISUAL
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        complexity = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])

        if complexity > 0.1:
            style_tags.append("busy")
        else:
            style_tags.append("clean")

        return {
            "dominant_colors_rgb": rgb_colors,
            "saturation_level": round(avg_saturation, 1),
            "brightness_level": round(avg_brightness, 1),
            "visual_complexity": round(complexity, 3),
            "style_tags": style_tags,
            "color_temperature": self._analyze_color_temperature(rgb_colors)
        }

    def _analyze_color_temperature(self, rgb_colors: List[Tuple[int, int, int]]) -> str:
        """Analiza si los colores son cálidos, fríos o neutros"""

        warm_score = 0
        cool_score = 0

        for r, g, b in rgb_colors:
            # Colores cálidos: más rojo/amarillo
            if r > g and r > b:
                warm_score += 1
            elif (r + g) > (2 * b):  # Amarillento
                warm_score += 0.5

            # Colores fríos: más azul/verde
            if b > r and b > g:
                cool_score += 1
            elif g > r:
                cool_score += 0.5

        if warm_score > cool_score:
            return "warm"
        elif cool_score > warm_score:
            return "cool"
        else:
            return "neutral"

    def _analyze_positioning_potential(self, cap, frame_count: int) -> Dict:
        """Analiza dónde puede posicionarse mejor en un video (inicio, medio, final)"""

        # Analizar primer y último frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        ret, first_frame = cap.read()

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count - 1)
        ret, last_frame = cap.read()

        if not ret:
            return {"best_position": "any"}

        positioning = {
            "best_positions": [],
            "transition_potential": 0,
            "hook_potential": 0,
            "outro_potential": 0
        }

        # Analizar diferencia entre primer y último frame
        if first_frame is not None and last_frame is not None:
            diff = cv2.absdiff(
                cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY),
                cv2.cvtColor(last_frame, cv2.COLOR_BGR2GRAY)
            )
            transition_score = np.mean(diff)
            positioning["transition_potential"] = min(
                10, transition_score / 20)

        # Potencial para hook (inicio): clips con acción/movimiento
        gray_first = cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_first, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])

        if edge_density > 0.05:  # Mucha actividad visual
            positioning["hook_potential"] = 8
            positioning["best_positions"].append("hook")

        # Potencial para outro: clips más calmados
        if edge_density < 0.03:
            positioning["outro_potential"] = 7
            positioning["best_positions"].append("outro")

        if not positioning["best_positions"]:
            positioning["best_positions"].append("body")

        return positioning

    def _analyze_audio_compatibility(self, duration: float) -> Dict:
        """Analiza compatibilidad con diferentes tipos de audio"""

        return {
            "good_for_voiceover": 2 <= duration <= 8,  # Duración ideal para narración
            "good_for_music_sync": duration >= 3,      # Mínimo para sync musical
            "loop_potential": 3 <= duration <= 6,      # Ideal para loops
            "silence_friendly": True,                   # Pexels videos son mudos
            "needs_audio_overlay": True
        }

    def _calculate_utility_scores(self, metadata: Dict) -> Dict:
        """Calcula scores de utilidad para diferentes casos de uso"""

        scores = {}

        # 1. SCORE PARA TUTORIALES TECH
        tech_score = 0
        if "text_heavy" in metadata["ai_matching"]["dominant_subjects"]:
            tech_score += 3
        if metadata["visual_style"]["style_tags"] and "clean" in metadata["visual_style"]["style_tags"]:
            tech_score += 2
        if metadata["positioning"]["best_positions"] and "body" in metadata["positioning"]["best_positions"]:
            tech_score += 2
        if metadata["shorts_compatibility"]["orientation_score"] >= 7:
            tech_score += 3
        scores["tech_tutorial"] = min(10, tech_score)

        # 2. SCORE PARA MOTIVACIÓN/FITNESS
        motivation_score = 0
        if "people" in metadata["ai_matching"]["dominant_subjects"]:
            motivation_score += 3
        if metadata["ai_matching"]["action_level"] >= 6:
            motivation_score += 3
        if metadata["ai_matching"]["emotional_tone"] == "positive":
            motivation_score += 2
        if "vibrant" in metadata["visual_style"]["style_tags"]:
            motivation_score += 2
        scores["motivation"] = min(10, motivation_score)

        # 3. SCORE PARA TRANSICIONES
        transition_score = metadata["positioning"]["transition_potential"]
        scores["transition"] = transition_score

        # 4. SCORE GENERAL DE CALIDAD
        quality_factors = [
            metadata["shorts_compatibility"]["orientation_score"] / 10,
            metadata["shorts_compatibility"]["duration_score"] / 10,
            # Complejidad visual
            min(1, metadata["visual_style"]["visual_complexity"] * 10),
            min(1, metadata["ai_matching"]["action_level"] / 10)
        ]
        scores["overall_quality"] = round(np.mean(quality_factors) * 10, 1)

        return scores

    def prepare_video_text_for_embedding(self, pexels_metadata: Dict, visual_style: Dict, ai_matching: Dict) -> str:
        """Prepara texto del video para generar embedding, siguiendo el patrón de embeding_creator.py"""
        text_parts = []

        # Información base de Pexels
        if pexels_metadata.get('query'):
            text_parts.append(str(pexels_metadata['query']))

        if pexels_metadata.get('category'):
            text_parts.append(f"category {pexels_metadata['category']}")

        # Información de usuario/tags si está disponible
        if pexels_metadata.get('user'):
            text_parts.append(f"creator {pexels_metadata['user']}")

        # Estilo visual
        if visual_style.get('style_tags'):
            text_parts.extend(
                [f"style {tag}" for tag in visual_style['style_tags']])

        if visual_style.get('color_temperature'):
            text_parts.append(f"color {visual_style['color_temperature']}")

        # Características de matching con IA
        if ai_matching.get('dominant_subjects'):
            text_parts.extend(
                [f"subject {subject}" for subject in ai_matching['dominant_subjects']])

        if ai_matching.get('emotional_tone'):
            text_parts.append(f"emotion {ai_matching['emotional_tone']}")

        # Nivel de acción/movimiento
        action_level = ai_matching.get('action_level', 0)
        if action_level > 7:
            text_parts.append("dynamic high-energy")
        elif action_level > 4:
            text_parts.append("moderate motion")
        else:
            text_parts.append("static calm")

        # Información técnica
        text_parts.append(f"duration {pexels_metadata.get('duration', 0)}s")
        text_parts.append(
            f"resolution {pexels_metadata.get('resolution', '')}")

        # Combinar todo
        full_text = " ".join(text_parts).strip()

        # Fallback si no hay texto
        if not full_text:
            full_text = f"video clip {pexels_metadata.get('category', 'general')}"

        return full_text

    def generate_video_embedding(self, text: str) -> List[float]:
        """Genera embedding de 768 dimensiones siguiendo el patrón de embeding_creator.py"""
        if not self.embedding_model:
            return []

        try:
            # Limpiar y normalizar texto (mismo proceso que embeding_creator.py)
            cleaned_text = text.replace('\n', ' ').replace('\t', ' ').strip()

            # Generar embedding normalizado (mismo proceso que embeding_creator.py)
            embedding = self.embedding_model.encode(
                cleaned_text, normalize_embeddings=True)

            # Convertir a lista Python para JSON (mismo que embeding_creator.py)
            return embedding.tolist()

        except Exception as e:
            print(f"    ⚠️  Error generando embedding: {e}")
            return []


class EnhancedPexelsDownloader:
    """Descargador mejorado con análisis de OpenCV integrado desde el script original"""

    def __init__(self):
        self.session = requests.Session()
        self.downloaded_count = 0
        self.total_size_mb = 0
        self.size_per_category = {}
        self.metadata_extractor = YouTubeShortsMetadataExtractor()

        # 4 categorías específicas requeridas
        self.categories = [
            'tech', 'education', 'food', 'fitness'
        ]

        # Crear carpetas por categoría e inicializar contadores
        for category in self.categories:
            os.makedirs(f"{DOWNLOAD_FOLDER}/{category}", exist_ok=True)
            self.size_per_category[category] = 0

    def download_from_pexels(self, query, category, limit=40):
        """Descarga clips de Pexels con filtro de duración 2-8 segundos hasta 125MB por categoría"""
        if self.size_per_category[category] >= TARGET_SIZE_PER_CATEGORY_MB:
            print(f"✅ {category}: Ya tenemos {TARGET_SIZE_PER_CATEGORY_MB}MB")
            return

        if self.total_size_mb >= TARGET_SIZE_TOTAL_MB:
            print(f"✅ Meta global alcanzada: {TARGET_SIZE_TOTAL_MB}MB")
            return

        print(f"🎬 Buscando en Pexels: '{query}' -> {category}")
        print(
            f"   📊 Actual: {self.size_per_category[category]:.1f}MB/{TARGET_SIZE_PER_CATEGORY_MB}MB")

        headers = {"Authorization": PEXELS_API_KEY}
        url = f"https://api.pexels.com/videos/search"

        params = {
            'query': query,
            'per_page': limit,
            'size': 'small',  # Preferir archivos más pequeños para Shorts
            'orientation': 'all'
        }

        try:
            response = self.session.get(url, headers=headers, params=params)

            if response.status_code != 200:
                print(f"❌ Error API Pexels: {response.status_code}")
                return

            data = response.json()
            valid_clips_found = 0

            for video in data.get('videos', []):
                # Verificar límites antes de continuar
                if (self.size_per_category[category] >= TARGET_SIZE_PER_CATEGORY_MB or
                        self.total_size_mb >= TARGET_SIZE_TOTAL_MB):
                    break

                # Filtrar por duración ANTES de descargar (2-8s para Shorts)
                duration = video.get('duration', 0)
                if duration < MIN_DURATION or duration > MAX_DURATION:
                    continue

                # Buscar archivo más pequeño pero de calidad aceptable
                best_file = None
                for file in video['video_files']:
                    if (file['file_type'] == 'video/mp4' and
                        file['width'] >= 720 and  # Al menos 720p
                            file['width'] <= 1280):   # Máximo 1280 para mantener tamaño pequeño
                        best_file = file
                        break

                if not best_file:
                    # Fallback: buscar cualquier mp4 decente
                    for file in video['video_files']:
                        if (file['file_type'] == 'video/mp4' and
                                file['width'] >= 640):
                            best_file = file
                            break

                if not best_file:
                    continue

                # Descargar video
                video_url = best_file['link']
                safe_query = query.replace(' ', '_').replace('/', '_')
                filename = f"pexels_{video['id']}_{safe_query}_{duration}s.mp4"
                filepath = f"{DOWNLOAD_FOLDER}/{category}/{filename}"

                if not os.path.exists(filepath):
                    # Preparar info del video para análisis
                    video_analysis_info = {
                        **video,
                        'query': query,
                        'category': category,
                        'width': best_file['width'],
                        'height': best_file['height']
                    }

                    file_size_mb = self.download_and_analyze_file(
                        video_url, filepath, video_analysis_info)

                    if file_size_mb and file_size_mb > 0:
                        # Verificar que no nos pasemos del límite
                        if (self.size_per_category[category] + file_size_mb <= TARGET_SIZE_PER_CATEGORY_MB and
                                self.total_size_mb + file_size_mb <= TARGET_SIZE_TOTAL_MB):

                            self.downloaded_count += 1
                            self.size_per_category[category] += file_size_mb
                            self.total_size_mb += file_size_mb
                            valid_clips_found += 1

                            time.sleep(DELAY_BETWEEN_DOWNLOADS)

                            print(
                                f"  ✅ {category}: {self.size_per_category[category]:.1f}MB/{TARGET_SIZE_PER_CATEGORY_MB}MB ({file_size_mb:.1f}MB)")
                        else:
                            # Eliminar archivo si nos pasamos del límite
                            os.remove(filepath)
                            # También eliminar metadatos si existen
                            if os.path.exists(f"{filepath}.json"):
                                os.remove(f"{filepath}.json")
                            print(
                                f"  ⚠️  Archivo eliminado (excede límite): {file_size_mb:.1f}MB")

            print(
                f"  📊 {valid_clips_found} clips válidos descargados para '{query}'")

        except Exception as e:
            print(f"❌ Error procesando '{query}': {e}")

    def download_and_analyze_file(self, url, filepath, video_info):
        """Descarga un archivo individual y realiza análisis con OpenCV"""
        try:
            filename = os.path.basename(filepath)
            duration = video_info.get('duration', 0)
            print(f"  📥 Descargando: {filename} ({duration}s)")

            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            downloaded_size = 0
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)

            file_size_mb = downloaded_size / (1024 * 1024)

            # Verificaciones de calidad para clips Shorts (2-8s)
            min_size_mb = duration * 0.15  # Al menos 0.15MB por segundo
            max_size_mb = duration * 4.0   # Máximo 4MB por segundo

            if file_size_mb < min_size_mb:
                os.remove(filepath)
                print(
                    f"    ❌ Archivo muy pequeño ({file_size_mb:.1f}MB), eliminado")
                return 0

            if file_size_mb > max_size_mb:
                os.remove(filepath)
                print(
                    f"    ❌ Archivo muy grande ({file_size_mb:.1f}MB), eliminado")
                return 0

            print(f"    ✅ Descargado: {file_size_mb:.1f}MB, {duration}s")

            # 🧠 ANÁLISIS CON OPENCV
            print(f"    🔍 Analizando con OpenCV...")

            # Metadatos base de Pexels
            pexels_metadata = {
                'id': video_info['id'],
                'source': 'pexels',
                'query': video_info.get('query', ''),
                'category': video_info.get('category', ''),
                'duration': duration,
                'resolution': f"{video_info.get('width', 0)}x{video_info.get('height', 0)}",
                'file_size_mb': file_size_mb,
                'url': video_info['url'],
                'user': video_info.get('user', {}).get('name', 'Unknown')
            }

            # Análisis avanzado con OpenCV
            enhanced_metadata = self.metadata_extractor.extract_youtube_shorts_metadata(
                filepath, pexels_metadata
            )

            # Guardar metadatos enriquecidos
            metadata_path = f"{filepath}.json"
            with open(metadata_path, 'w') as f:
                json.dump(enhanced_metadata, f, indent=2)

            # Mostrar scores de utilidad
            scores = enhanced_metadata.get("utility_scores", {})
            shorts_compat = enhanced_metadata.get("shorts_compatibility", {})
            embedding_info = enhanced_metadata.get("embedding", {})

            print(f"    📊 Scores: Tech={scores.get('tech_tutorial', 0):.1f}/10, "
                  f"Motivación={scores.get('motivation', 0):.1f}/10, "
                  f"Calidad={scores.get('overall_quality', 0):.1f}/10")
            print(f"    📱 Shorts: Orientación={shorts_compat.get('orientation_score', 0):.1f}/10, "
                  f"Duración={shorts_compat.get('duration_score', 0):.1f}/10")

            # Mostrar información de embeddings
            if embedding_info and embedding_info.get("vector"):
                print(f"    🧠 Embedding: {embedding_info.get('dimensions', 0)} dims, "
                      f"modelo {embedding_info.get('model', 'unknown')}")
                text_source = embedding_info.get('text_source', '')
                if text_source:
                    print(f"    📝 Texto base: {text_source[:100]}...")
            else:
                print(f"    ⚠️  Embedding: No generado")

            return file_size_mb

        except Exception as e:
            print(f"    ❌ Error descargando/analizando: {e}")
            if os.path.exists(filepath):
                os.remove(filepath)
            # Limpiar metadatos si existen
            metadata_path = f"{filepath}.json"
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
            return 0


def download_plan_enhanced():
    """Plan de descarga con análisis mejorado"""

    print("🧠 DESCARGA MEJORADA CON OPENCV + EMBEDDINGS")
    print("=" * 60)
    print("✨ Características:")
    print("   • Análisis de compatibilidad con YouTube Shorts")
    print("   • Detección de personas y emociones")
    print("   • Clasificación de estilo visual")
    print("   • Scores de utilidad para diferentes templates")
    print("   • Análisis de posicionamiento en video")
    print("   • Generación de embeddings con all-mpnet-base-v2 (768 dims)")
    print("   • Texto enriquecido para búsqueda semántica")
    print()

    downloader = EnhancedPexelsDownloader()

    # Queries optimizadas para YouTube Shorts
    download_queries = {
        'tech': [
            # 'programming code screen', 'developer typing keyboard', 'software development',
            # 'coding workspace setup', 'laptop multiple monitors', 'web development',
            # 'mobile app development', 'data analysis dashboard', 'artificial intelligence',
            # 'terminal command line', 'debugging code editor', 'git version control',
            # 'database query visualization', 'cloud computing setup', 'cybersecurity monitoring',
            # 'neural network training', 'server deployment', 'API testing tools',
            # 'machine learning models', 'blockchain development', 'IoT device programming',

            # 'python code editor', 'javascript debugging', 'react development', 'docker containers',
            # 'kubernetes deployment', 'microservices architecture', 'agile development', 'devops pipeline',
            # 'code review process', 'unit testing framework', 'algorithm visualization', 'data structures',
            # 'frontend backend integration', 'responsive design', 'performance optimization',
            # 'security vulnerability scan', 'CI CD automation', 'version control workflow',
            # 'tech conference presentation', 'hackathon coding', 'open source contribution',
            # 'startup tech office', 'silicon valley workspace', 'remote developer setup'
        ],
        'education': [
            'student online learning', 'teacher explaining', 'book reading study',
            'e-learning computer', 'tutorial demonstration', 'knowledge sharing',
            'academic research', 'university lecture hall', 'educational content',
            'study notes organized', 'exam preparation', 'library study session',
            'online course platform', 'educational video recording', 'whiteboard explanation',
            'student presentation', 'group study collaboration', 'research paper writing',
            'academic conference', 'thesis defense', 'laboratory practical',
            'educational app learning', 'skill development', 'certification course',
            'language learning practice', 'STEM education', 'homework assistance',
            'educational technology', 'classroom interaction', 'distance learning setup',
            'academic achievement', 'graduation ceremony', 'scholarship success'
        ],
        'food': [
            'chef cooking kitchen', 'healthy meal preparation', 'food ingredients fresh',
            'cooking tutorial step', 'recipe demonstration', 'meal prep healthy',
            'food styling photography', 'kitchen cooking tips', 'culinary arts',

            'baking bread homemade', 'pasta making process', 'vegetarian recipes',
            'street food preparation', 'gourmet plating presentation', 'spices herbs collection',
            'kitchen utensils professional', 'food safety hygiene', 'restaurant kitchen',
            'farmers market fresh', 'organic ingredients', 'food truck cooking',
            'wine pairing selection', 'dessert decoration', 'knife skills demonstration',
            'international cuisine', 'comfort food preparation', 'diet meal planning',
            'cooking competition', 'food blogger setup', 'recipe card writing',
            'seasonal ingredients', 'food preservation', 'kitchen organization'
        ],
        'fitness': [
            'gym workout exercise', 'running outdoor fitness', 'yoga practice meditation',
            'strength training gym', 'cardio exercise training', 'fitness motivation',
            'sports training athlete', 'wellness lifestyle healthy', 'active workout',
            'home workout routine', 'crossfit training', 'pilates stretching',
            'martial arts training', 'swimming pool exercise', 'cycling outdoor',
            'weightlifting powerlifting', 'fitness tracking app', 'protein shake preparation',
            'fitness coach training', 'body transformation', 'athletic performance',
            'recovery stretching', 'functional training', 'HIIT workout intense',
            'fitness equipment setup', 'outdoor adventure sport', 'team sports training',
            'fitness progress tracking', 'nutrition meal prep', 'wellness journey',
            'fitness community group', 'personal trainer session', 'fitness challenge'
        ]
    }

    print(f"🎯 Plan: {TARGET_SIZE_TOTAL_MB}MB total")
    print(f"📂 {TARGET_SIZE_PER_CATEGORY_MB}MB por cada categoría: {', '.join(downloader.categories)}")
    print(
        f"⏱️ Duración optimizada para Shorts: {MIN_DURATION}-{MAX_DURATION} segundos")
    print(f"🔑 Usando API key de Pexels\n")
    # Ejecutar descarga con análisis integrado
    while downloader.total_size_mb < TARGET_SIZE_TOTAL_MB:
        made_progress = False

        for category, queries in download_queries.items():
            if downloader.size_per_category[category] >= TARGET_SIZE_PER_CATEGORY_MB:
                continue

            print(f"\n📁 === PROCESANDO CATEGORÍA: {category.upper()} ===")

            for query in queries:
                if (downloader.size_per_category[category] >= TARGET_SIZE_PER_CATEGORY_MB or
                        downloader.total_size_mb >= TARGET_SIZE_TOTAL_MB):
                    break

                # Añadir info de categoría para el análisis
                downloader.download_from_pexels(query, category)
                made_progress = True
                time.sleep(1)

            print(
                f"📊 {category} actual: {downloader.size_per_category[category]:.1f}MB/{TARGET_SIZE_PER_CATEGORY_MB}MB")

            if downloader.total_size_mb >= TARGET_SIZE_TOTAL_MB:
                break

        if not made_progress:
            print("⚠️  No se puede descargar más contenido con las queries actuales")
            break

    # Resumen final con stats de OpenCV
    print_enhanced_summary(downloader)


def print_enhanced_summary(downloader):
    """Resumen con estadísticas de análisis OpenCV"""

    print(f"\n🎉 ¡DESCARGA Y ANÁLISIS COMPLETADOS!")
    print(
        f"📊 Total: {downloader.total_size_mb:.1f}MB ({downloader.downloaded_count} clips)")

    # Analizar metadatos para stats
    for category in downloader.categories:
        category_path = f"{DOWNLOAD_FOLDER}/{category}"
        if not os.path.exists(category_path):
            continue

        json_files = [f for f in os.listdir(
            category_path) if f.endswith('.json')]

        tech_scores = []
        motivation_scores = []
        quality_scores = []

        for json_file in json_files:
            try:
                with open(f"{category_path}/{json_file}", 'r') as f:
                    data = json.load(f)
                    scores = data.get("utility_scores", {})
                    tech_scores.append(scores.get("tech_tutorial", 0))
                    motivation_scores.append(scores.get("motivation", 0))
                    quality_scores.append(scores.get("overall_quality", 0))
            except:
                continue

        if tech_scores:
            print(f"\n📁 {category.upper()}:")
            print(
                f"   🎯 Clips ideales para tech: {len([s for s in tech_scores if s >= 7])}")
            print(
                f"   💪 Clips ideales para motivación: {len([s for s in motivation_scores if s >= 7])}")
            print(f"   ⭐ Calidad promedio: {np.mean(quality_scores):.1f}/10")


if __name__ == "__main__":
    if not PEXELS_API_KEY:
        print("❌ ERROR: API key de Pexels no encontrada")
        exit()

    download_plan_enhanced()
