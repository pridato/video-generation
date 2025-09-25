"""
Script Repository en memoria - NO persiste en BD

🎯 PROPÓSITO:
- Gestiona scripts como entidades temporales
- Permite trabajo con enhanced scripts sin persistencia
- Facilita la creación de shorts desde scripts mejorados
- Cachea scripts durante el proceso de generación

"""

import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import asdict

from app.domain.repositories.script_repository import ScriptRepository
from app.domain.entities.script import Script, Category, Tone

logger = logging.getLogger(__name__)


class InMemoryScriptRepository(ScriptRepository):
    """
    Implementación en memoria del repositorio de scripts.

    💡 Scripts NO se guardan en BD, solo se mantienen en memoria
    durante el proceso de generación de videos.
    """

    def __init__(self):
        self._scripts: Dict[str, Script] = {}
        # user_id -> [script_ids]
        self._user_scripts: Dict[str, List[str]] = {}

    # ============= OPERACIONES CRUD =============

    async def create(self, entity: Script) -> Script:
        """
        Crea un nuevo script en memoria.

        Args:
            entity (Script): El script a crear.

        Returns:
            Script: El script creado con ID asignado.

        Example:
            script = Script(
                id=None,
                user_id="user123",
                title="My First Script",
                content="This is the content of the script.",
                category=Category.EDUCATIONAL,
                tone=Tone.FORMAL,
                created_at=None,
                updated_at=None
            )
            created_script = await repository.create(script)
            print(created_script.id)  # UUID generado
        """
        if entity.id is None:
            entity.id = str(uuid.uuid4())

        entity.created_at = datetime.utcnow()
        self._scripts[entity.id] = entity

        # Indexar por usuario
        if entity.user_id not in self._user_scripts:
            self._user_scripts[entity.user_id] = []
        self._user_scripts[entity.user_id].append(entity.id)

        logger.info(f"💾 Script creado en memoria: {entity.id}")
        return entity

    async def get_by_id(self, id: str) -> Optional[Script]:
        """
        Obtiene un script por su ID en memoria.

        Args:
            id (str): ID del script a obtener.

        Returns:
            Optional[Script]: El script si se encuentra, None en caso contrario.

        Example:
            script = await repository.get_by_id("some-script-id")
        """
        return self._scripts.get(id)

    async def update(self, entity: Script) -> Script:
        """
        Actualiza un script en memoria.

        Args:
            entity (Script): El script a actualizar.

        Returns:
            Script: El script actualizado.

        Example:
            script = await repository.get_by_id("some-script-id")
            script.title = "Updated Title"
            updated_script = await repository.update(script)
        """
        if entity.id and entity.id in self._scripts:
            entity.updated_at = datetime.utcnow()
            self._scripts[entity.id] = entity
            logger.info(f"📝 Script actualizado en memoria: {entity.id}")
            return entity
        raise ValueError(f"Script {entity.id} no encontrado")

    async def delete(self, id: str) -> bool:
        """
        Elimina un script de memoria por su ID.

        Args:
            id (str): ID del script a eliminar.

        Returns:
            bool: True si el script fue eliminado, False si no se encontró.

        Example:
            success = await repository.delete("some-script-id")

        """
        if id in self._scripts:
            script = self._scripts[id]

            # Remover de índice de usuario
            if script.user_id in self._user_scripts:
                self._user_scripts[script.user_id].remove(id)
                if not self._user_scripts[script.user_id]:
                    del self._user_scripts[script.user_id]

            del self._scripts[id]
            logger.info(f"🗑️ Script eliminado de memoria: {id}")
            return True
        return False

    # ============= CONSULTAS ESPECÍFICAS =============

    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Script]:
        script_ids = self._user_scripts.get(user_id, [])

        # Aplicar offset y limit
        paginated_ids = script_ids[offset:offset + limit]

        scripts = [self._scripts[sid]
                   for sid in paginated_ids if sid in self._scripts]

        # Ordenar por fecha de creación (más recientes primero)
        scripts.sort(key=lambda x: x.created_at, reverse=True)

        return scripts

    async def get_by_categoria(self, categoria: str, limit: int = 10) -> List[Script]:
        scripts = [
            script for script in self._scripts.values()
            if script.category.value == categoria
        ]

        # Ordenar por fecha de creación
        scripts.sort(key=lambda x: x.created_at, reverse=True)

        return scripts[:limit]

    async def search_by_content(self, query: str, user_id: Optional[str] = None) -> List[Script]:
        query_lower = query.lower()
        results = []

        for script in self._scripts.values():
            # Filtrar por usuario si se especifica
            if user_id and script.user_id != user_id:
                continue

            # Buscar en texto original y mejorado
            if (query_lower in script.original_text.lower() or
                (script.enhanced_text and query_lower in script.enhanced_text.lower()) or
                    any(query_lower in keyword.lower() for keyword in script.keywords)):
                results.append(script)

        # Ordenar por relevancia (scripts con enhanced_text primero)
        results.sort(key=lambda x: (
            x.enhanced_text is not None, x.created_at), reverse=True)

        return results

    async def get_similar_scripts(self, embedding: List[float], limit: int = 5) -> List[Script]:
        """
        Obtiene scripts similares usando embeddings.

        🔍 En memoria no podemos hacer búsqueda vectorial real,
        así que retornamos scripts aleatorios como mock.
        """
        scripts_with_embeddings = [
            script for script in self._scripts.values()
            if script.embedding is not None
        ]

        # Mock: retornar scripts ordenados por fecha
        scripts_with_embeddings.sort(key=lambda x: x.created_at, reverse=True)

        return scripts_with_embeddings[:limit]

    async def get_recent_by_user(self, user_id: str, days: int = 30) -> List[Script]:
        """Obtiene scripts recientes de un usuario."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        script_ids = self._user_scripts.get(user_id, [])
        recent_scripts = []

        for script_id in script_ids:
            if script_id in self._scripts:
                script = self._scripts[script_id]
                if script.created_at >= cutoff_date:
                    recent_scripts.append(script)

        recent_scripts.sort(key=lambda x: x.created_at, reverse=True)
        return recent_scripts

    async def update_embedding(self, script_id: str, embedding: List[float]) -> bool:
        """Actualiza el embedding de un script."""
        if script_id in self._scripts:
            self._scripts[script_id].embedding = embedding
            logger.info(f"🔢 Embedding actualizado para script: {script_id}")
            return True
        return False

    async def get_scripts_without_embeddings(self, limit: int = 100) -> List[Script]:
        """Obtiene scripts que no tienen embeddings."""
        scripts_without_embeddings = [
            script for script in self._scripts.values()
            if script.embedding is None
        ]

        return scripts_without_embeddings[:limit]

    async def get_popular_by_category(self, categoria: str, limit: int = 10) -> List[Script]:
        """
        Obtiene scripts populares por categoría.

        🔥 En memoria simulamos "popularidad" por fecha de creación.
        """
        return await self.get_by_categoria(categoria, limit)

    async def count_by_user(self, user_id: str, date_from: Optional[datetime] = None) -> int:
        """Cuenta scripts de un usuario desde una fecha."""
        script_ids = self._user_scripts.get(user_id, [])

        if date_from is None:
            return len(script_ids)

        count = 0
        for script_id in script_ids:
            if script_id in self._scripts:
                script = self._scripts[script_id]
                if script.created_at >= date_from:
                    count += 1

        return count

    # ============= MÉTODOS AUXILIARES =============

    def get_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del repositorio en memoria."""
        return {
            "total_scripts": len(self._scripts),
            "users_with_scripts": len(self._user_scripts),
            "scripts_with_embeddings": len([
                s for s in self._scripts.values() if s.embedding is not None
            ]),
            "scripts_enhanced": len([
                s for s in self._scripts.values() if s.enhanced_text is not None
            ]),
            "categories": list(set(s.category.value for s in self._scripts.values())),
            "oldest_script": min([s.created_at for s in self._scripts.values()], default=None),
            "newest_script": max([s.created_at for s in self._scripts.values()], default=None)
        }

    def clear_old_scripts(self, hours: int = 24) -> int:
        """
        Limpia scripts antiguos para liberar memoria.

        Args:
            hours: Scripts más antiguos que X horas se eliminan

        Returns:
            Número de scripts eliminados
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        old_script_ids = [
            sid for sid, script in self._scripts.items()
            if script.created_at < cutoff
        ]

        for script_id in old_script_ids:
            await self.delete(script_id)

        logger.info(
            f"🧹 Limpieza: {len(old_script_ids)} scripts antiguos eliminados")
        return len(old_script_ids)

    def clear_all(self) -> None:
        """Limpia todos los scripts de memoria (para testing)."""
        self._scripts.clear()
        self._user_scripts.clear()
        logger.info("🧹 Todos los scripts eliminados de memoria")
