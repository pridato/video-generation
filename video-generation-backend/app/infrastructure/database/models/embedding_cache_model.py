"""
Embedding Cache Model - Versión simple para mapeo BD

"""

import hashlib
from typing import List, Optional, Dict, Any
from datetime import datetime


class EmbeddingCacheModel:
    """Modelo simple para mapear cache de embeddings entre BD y aplicación."""

    def __init__(self, db_row: Dict[str, Any]):
        """
        Args:
            db_row: Fila de la BD con campos: text_hash, embedding, text_preview, usage_count, created_at, last_used_at
        """
        self.db_row = db_row

    def get_embedding(self) -> Optional[List[float]]:
        """
        Extrae el embedding de la BD manejando formato pgvector.

        Returns:
            List[float] Lista de floats o None si error
        """
        if not self.db_row.get('embedding'):
            return None

        try:
            embedding_raw = self.db_row['embedding']

            # Ya es lista
            if isinstance(embedding_raw, list):
                return [float(x) for x in embedding_raw]

            # String formato pgvector "[0.1,0.2,0.3]"
            if isinstance(embedding_raw, str):
                embedding_str = embedding_raw.strip().strip('[]')
                return [float(x.strip()) for x in embedding_str.split(',')]

            return None

        except (ValueError, TypeError):
            return None

    @staticmethod
    def create_insert_data(text_hash: str, embedding: List[float], text_preview: Optional[str] = None) -> Dict[str, Any]:
        """
        Crea datos para insertar en BD.

        Args:
            text_hash (str): Hash SHA-256 del texto
            embedding (List[float]): Lista de floats del embedding
            text_preview (Optional[str]): Texto original o preview

        Returns:
            Dict[str, Any]: Datos para inserción en BD

        Example:
            data = EmbeddingCacheModel.create_insert_data("abc123", [0.1, 0.2, 0.3], "Texto de ejemplo")
            # data:
            {
                'text_hash': 'abc123',
                'embedding': [0.1, 0.2, 0.3],
                'text_preview': 'Texto de ejemplo',
                'usage_count': 1,
                'created_at': '2024-06-01T12:00:00.000000',
                'last_used_at': '2024-06-01T12:00:00.000000'
            }


        """
        return {
            'text_hash': text_hash,
            'embedding': embedding,  # pgvector maneja conversión
            'text_preview': text_preview[:100] if text_preview else None,
            'usage_count': 1,
            'created_at': datetime.utcnow().isoformat(),
            'last_used_at': datetime.utcnow().isoformat()
        }

    @staticmethod
    def generate_text_hash(text: str) -> str:
        """
        Genera hash SHA-256 consistente para texto.

        Args:
            text (str): Texto a hashear

        Returns:
            str: Hash SHA-256 del texto
        """
        normalized_text = text.strip().lower()
        return hashlib.sha256(normalized_text.encode('utf-8')).hexdigest()
