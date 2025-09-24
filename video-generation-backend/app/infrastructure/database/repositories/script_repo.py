"""
Concrete implementation of Script Repository
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func

from app.domain.repositories.script_repository import ScriptRepository
from app.domain.entities.script import Script, SegmentoScript, Tono, Categoria, TipoSegmento
from ..models import ScriptDB, SegmentoScriptDB, UsuarioDB


class SQLScriptRepository(ScriptRepository):
    """Implementación concreta del repositorio de scripts usando SQLAlchemy."""

    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, db_script: ScriptDB) -> Script:
        """Convierte un modelo de BD a entidad de dominio."""
        segmentos = [
            SegmentoScript(
                texto=seg.texto,
                duracion=seg.duracion,
                tipo=TipoSegmento(seg.tipo),
                posicion=seg.posicion
            )
            for seg in db_script.segmentos
        ]

        return Script(
            id=db_script.id,
            texto_original=db_script.texto_original,
            texto_mejorado=db_script.texto_mejorado,
            duracion_objetivo=db_script.duracion_objetivo,
            tono=Tono(db_script.tono.value),
            audiencia_objetivo=db_script.audiencia_objetivo,
            categoria=Categoria(db_script.categoria.value),
            segmentos=segmentos,
            palabras_clave=db_script.palabras_clave or [],
            mejoras_aplicadas=db_script.mejoras_aplicadas or [],
            embedding=db_script.embedding,
            usuario_id=db_script.usuario_id,
            created_at=db_script.created_at,
            updated_at=db_script.updated_at
        )

    def _to_db_model(self, script: Script) -> ScriptDB:
        """Convierte una entidad de dominio a modelo de BD."""
        return ScriptDB(
            id=script.id,
            usuario_id=script.usuario_id,
            texto_original=script.texto_original,
            texto_mejorado=script.texto_mejorado,
            duracion_objetivo=script.duracion_objetivo,
            tono=script.tono.value,
            audiencia_objetivo=script.audiencia_objetivo,
            categoria=script.categoria.value,
            palabras_clave=script.palabras_clave,
            mejoras_aplicadas=script.mejoras_aplicadas,
            embedding=script.embedding,
            created_at=script.created_at,
            updated_at=script.updated_at
        )

    async def create(self, entity: Script) -> Script:
        """Crea un nuevo script."""
        db_script = self._to_db_model(entity)
        self.session.add(db_script)

        # Crear segmentos
        for segmento in entity.segmentos:
            db_segmento = SegmentoScriptDB(
                script_id=db_script.id,
                texto=segmento.texto,
                duracion=segmento.duracion,
                tipo=segmento.tipo.value,
                posicion=segmento.posicion
            )
            self.session.add(db_segmento)

        self.session.commit()
        self.session.refresh(db_script)
        return self._to_entity(db_script)

    async def get_by_id(self, id: str) -> Optional[Script]:
        """Obtiene un script por su ID."""
        db_script = self.session.query(ScriptDB).filter(ScriptDB.id == id).first()
        return self._to_entity(db_script) if db_script else None

    async def update(self, entity: Script) -> Script:
        """Actualiza un script existente."""
        db_script = self.session.query(ScriptDB).filter(ScriptDB.id == entity.id).first()
        if not db_script:
            raise ValueError(f"Script with id {entity.id} not found")

        # Actualizar campos
        db_script.texto_mejorado = entity.texto_mejorado
        db_script.palabras_clave = entity.palabras_clave
        db_script.mejoras_aplicadas = entity.mejoras_aplicadas
        db_script.embedding = entity.embedding
        db_script.updated_at = datetime.utcnow()

        # Actualizar segmentos - borrar existentes y crear nuevos
        self.session.query(SegmentoScriptDB).filter(
            SegmentoScriptDB.script_id == entity.id
        ).delete()

        for segmento in entity.segmentos:
            db_segmento = SegmentoScriptDB(
                script_id=entity.id,
                texto=segmento.texto,
                duracion=segmento.duracion,
                tipo=segmento.tipo.value,
                posicion=segmento.posicion
            )
            self.session.add(db_segmento)

        self.session.commit()
        self.session.refresh(db_script)
        return self._to_entity(db_script)

    async def delete(self, id: str) -> bool:
        """Elimina un script."""
        result = self.session.query(ScriptDB).filter(ScriptDB.id == id).delete()
        self.session.commit()
        return result > 0

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Script]:
        """Obtiene todos los scripts con paginación."""
        db_scripts = (
            self.session.query(ScriptDB)
            .order_by(desc(ScriptDB.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Cuenta scripts con filtros opcionales."""
        query = self.session.query(func.count(ScriptDB.id))

        if filters:
            if 'usuario_id' in filters:
                query = query.filter(ScriptDB.usuario_id == filters['usuario_id'])
            if 'categoria' in filters:
                query = query.filter(ScriptDB.categoria == filters['categoria'])

        return query.scalar()

    async def exists(self, id: str) -> bool:
        """Verifica si existe un script."""
        return self.session.query(ScriptDB.id).filter(ScriptDB.id == id).first() is not None

    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Script]:
        """Obtiene scripts por ID de usuario."""
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.usuario_id == user_id)
            .order_by(desc(ScriptDB.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def get_by_categoria(self, categoria: str, limit: int = 10) -> List[Script]:
        """Obtiene scripts por categoría."""
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.categoria == categoria)
            .order_by(desc(ScriptDB.created_at))
            .limit(limit)
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def search_by_content(self, query: str, user_id: Optional[str] = None) -> List[Script]:
        """Busca scripts por contenido."""
        db_query = self.session.query(ScriptDB).filter(
            ScriptDB.texto_original.contains(query) |
            ScriptDB.texto_mejorado.contains(query)
        )

        if user_id:
            db_query = db_query.filter(ScriptDB.usuario_id == user_id)

        db_scripts = db_query.order_by(desc(ScriptDB.created_at)).limit(20).all()
        return [self._to_entity(script) for script in db_scripts]

    async def get_similar_scripts(self, embedding: List[float], limit: int = 5) -> List[Script]:
        """Obtiene scripts similares usando búsqueda vectorial."""
        # Nota: Esta implementación es básica. En producción se usaría una base de datos vectorial
        # como pgvector, Pinecone, o Weaviate para búsqueda semántica eficiente
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.embedding.isnot(None))
            .order_by(desc(ScriptDB.created_at))
            .limit(limit * 3)  # Obtener más para filtrar
            .all()
        )

        # Calcular similitud coseno básica (en producción se haría en la BD)
        similar_scripts = []
        for script in db_scripts:
            if script.embedding and len(script.embedding) == len(embedding):
                # Similitud coseno simplificada
                dot_product = sum(a * b for a, b in zip(embedding, script.embedding))
                magnitude_a = sum(a * a for a in embedding) ** 0.5
                magnitude_b = sum(b * b for b in script.embedding) ** 0.5

                if magnitude_a > 0 and magnitude_b > 0:
                    similarity = dot_product / (magnitude_a * magnitude_b)
                    similar_scripts.append((script, similarity))

        # Ordenar por similitud y tomar los top
        similar_scripts.sort(key=lambda x: x[1], reverse=True)
        return [self._to_entity(script) for script, _ in similar_scripts[:limit]]

    async def get_recent_by_user(self, user_id: str, days: int = 30) -> List[Script]:
        """Obtiene scripts recientes de un usuario."""
        fecha_limite = datetime.utcnow() - timedelta(days=days)
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(
                and_(
                    ScriptDB.usuario_id == user_id,
                    ScriptDB.created_at >= fecha_limite
                )
            )
            .order_by(desc(ScriptDB.created_at))
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def update_embedding(self, script_id: str, embedding: List[float]) -> bool:
        """Actualiza el embedding de un script."""
        result = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.id == script_id)
            .update({ScriptDB.embedding: embedding, ScriptDB.updated_at: datetime.utcnow()})
        )
        self.session.commit()
        return result > 0

    async def get_scripts_without_embeddings(self, limit: int = 100) -> List[Script]:
        """Obtiene scripts sin embeddings para procesamiento batch."""
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.embedding.is_(None))
            .limit(limit)
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def get_popular_by_category(self, categoria: str, limit: int = 10) -> List[Script]:
        """Obtiene scripts populares por categoría."""
        # En esta implementación básica, ordenamos por fecha reciente
        # En producción se podría agregar un sistema de rating/likes
        db_scripts = (
            self.session.query(ScriptDB)
            .filter(ScriptDB.categoria == categoria)
            .order_by(desc(ScriptDB.created_at))
            .limit(limit)
            .all()
        )
        return [self._to_entity(script) for script in db_scripts]

    async def count_by_user(self, user_id: str, date_from: Optional[datetime] = None) -> int:
        """Cuenta scripts de un usuario desde una fecha."""
        query = self.session.query(func.count(ScriptDB.id)).filter(
            ScriptDB.usuario_id == user_id
        )

        if date_from:
            query = query.filter(ScriptDB.created_at >= date_from)

        return query.scalar()