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
