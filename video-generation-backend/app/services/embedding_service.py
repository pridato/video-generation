"""
Servicio de generación de embeddings usando all-mpnet-base-v2
Basado en el script embeding_creator.py pero optimizado para integración con el backend
"""

import logging
from typing import List
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Servicio para generar embeddings de scripts usando el modelo all-mpnet-base-v2
    Mismo modelo utilizado en embeding_creator.py para consistencia
    """

    def __init__(self):
        """
        Inicializa el servicio de embeddings con el modelo all-mpnet-base-v2
        """
        try:
            logger.info("🤖 Inicializando servicio de embeddings...")
            logger.info("📥 Cargando modelo all-mpnet-base-v2...")

            # Usar el mismo modelo que embeding_creator.py
            self.model = SentenceTransformer('all-mpnet-base-v2')

            logger.info(
                "✅ Modelo all-mpnet-base-v2 cargado - 768 dimensiones, 82% accuracy")

        except Exception as e:
            logger.error(f"❌ Error inicializando servicio de embeddings: {e}")
            raise ValueError(f"No se pudo cargar el modelo de embeddings: {e}")

    def generate_script_embedding(self, script: str) -> List[float]:
        """
        Genera embedding de 768 dimensiones para un script

        Args:
            script: Texto del script a procesar

        Returns:
            Lista de 768 floats representando el embedding normalizado

        Raises:
            ValueError: Si el script está vacío o es inválido
        """
        try:
            # Validar entrada
            if not script or not script.strip():
                raise ValueError("El script no puede estar vacío")

            # Limpiar y normalizar texto (mismo proceso que embeding_creator.py)
            cleaned_script = script.replace(
                '\n', ' ').replace('\t', ' ').strip()

            # Generar embedding normalizado (mismo proceso que embeding_creator.py)
            embedding = self.model.encode(
                cleaned_script, normalize_embeddings=True)

            # Convertir a lista Python para JSON (mismo que embeding_creator.py)
            embedding_list = embedding.tolist()

            logger.info(
                f"✅ Embedding generado: {len(embedding_list)} dimensiones")
            return embedding_list

        except Exception as e:
            logger.error(f"❌ Error generando embedding para script: {e}")
            raise ValueError(f"Error procesando embedding: {e}")

    def prepare_script_text(self, script: str, categoria: str = '', keywords: List[str] = []) -> str:
        """
        Prepara el texto del script para embedding, similar a prepare_clip_text en embeding_creator.py

        Args:
            script: Texto principal del script
            categoria: Categoría del contenido (opcional)
            keywords: Palabras clave adicionales (opcional)

        Returns:
            Texto preparado y enriquecido para embedding
        """
        text_parts = [script]

        # Agregar categoría si está disponible
        if categoria:
            text_parts.append(f"category {categoria}")

        # Agregar palabras clave si están disponibles
        if keywords:
            text_parts.extend([f"keyword {kw}" for kw in keywords])

        # Combinar todo
        full_text = " ".join(text_parts).strip()

        # Limpiar texto
        return full_text.replace('\n', ' ').replace('\t', ' ').strip()

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calcula la similitud coseno entre dos embeddings

        Args:
            embedding1: Primer embedding
            embedding2: Segundo embedding

        Returns:
            Similitud coseno entre 0 y 1
        """
        try:
            # Convertir a arrays numpy
            emb1 = np.array(embedding1)
            emb2 = np.array(embedding2)

            # Calcular similitud coseno (los embeddings ya están normalizados)
            similarity = np.dot(emb1, emb2)

            return float(similarity)

        except Exception as e:
            logger.error(f"❌ Error calculando similitud: {e}")
            return 0.0


# Instancia singleton del servicio
try:
    embedding_service = EmbeddingService()
except Exception as e:
    logger.warning(f"⚠️ No se pudo inicializar servicio de embeddings: {e}")
    embedding_service = None
