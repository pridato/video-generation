"""
Script Repository Interface - Interfaz completa para gestión de scripts

🎯 PROPÓSITO:
- Define el contrato para persistencia de scripts
- Hereda operaciones CRUD básicas de BaseRepository
- Añade métodos específicos para scripts (búsquedas, embeddings, etc.)
- Sigue el patrón Repository para desacoplar dominio de infraestructura

"""

from abc import abstractmethod
from typing import List, Optional
from datetime import datetime

from .base import BaseRepository
from ..entities.script import Script


class ScriptRepository(BaseRepository[Script]):
    """
    Interfaz del repositorio para scripts.

    Hereda de BaseRepository las operaciones CRUD básicas:
    - create(entity) -> Entity
    - get_by_id(id) -> Optional[Entity] 
    - get_all(limit, offset) -> List[Entity]
    - update(entity) -> Entity
    - delete(id) -> bool

    Y define métodos específicos para scripts.
    """

    @property
    def _model(self) -> type:
        """Modelo de la entidad que maneja el repositorio."""
        return Script

    # ============= CONSULTAS POR USUARIO =============

    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Script]:
        """
        Obtiene scripts por ID de usuario con paginación.

        Args:
            user_id (str): ID del usuario
            limit (int): Número máximo de scripts a retornar (default: 10)
            offset (int): Número de scripts a omitir para paginación (default: 0)

        Returns:
            List[Script]: Lista de scripts del usuario ordenados por fecha de creación (más recientes primero)

        Example:
            scripts = await repo.get_by_user_id("user123", limit=5, offset=10)
        """
        pass

    @abstractmethod
    async def get_recent_by_user(self, user_id: str, days: int = 30) -> List[Script]:
        """
        Obtiene scripts recientes de un usuario.

        Args:
            user_id (str): ID del usuario
            days (int): Número de días hacia atrás (default: 30)

        Returns:
            List[Script]: Lista de scripts creados en los últimos X días

        Example:
            recent = await repo.get_recent_by_user("user123", days=7)  # Última semana
        """
        pass

    @abstractmethod
    async def count_by_user(self, user_id: str, date_from: Optional[datetime] = None) -> int:
        """
        Cuenta scripts de un usuario desde una fecha específica.

        Args:
            user_id (str): ID del usuario
            date_from (Optional[datetime]): Fecha desde la cual contar (opcional, si no se provee cuenta todos)

        Returns:
            int: Número total de scripts del usuario

        Example:
            total = await repo.count_by_user("user123")
            this_month = await repo.count_by_user("user123", datetime(2024, 1, 1))
        """
        pass

    # ============= BÚSQUEDAS POR CONTENIDO =============

    @abstractmethod
    async def get_by_category(self, category: str, limit: int = 10) -> List[Script]:
        """
        Obtiene scripts por categoría.

        Args:
            category (str): Categoría del script (tech, marketing, education, etc.)
            limit (int): Número máximo de scripts a retornar

        Returns:
            List[Script]: Lista de scripts de la categoría especificada

        Example:
            tech_scripts = await repo.get_by_categoria("tech", limit=20)
        """
        pass

    @abstractmethod
    async def search_by_content(self, query: str, user_id: Optional[str] = None) -> List[Script]:
        """
        Busca scripts por contenido usando embeddings vectoriales o texto.

        Args:
            query (str): Texto a buscar en el contenido de los scripts
            user_id (Optional[str]): Filtrar por usuario específico (opcional)

        Returns:
            List[Script]: Lista de scripts que coinciden con la búsqueda, ordenados por relevancia

        Example:
            results = await repo.search_by_content("python programming")
            user_results = await repo.search_by_content("marketing tips", user_id="user123")
        """
        pass

    @abstractmethod
    async def get_popular_by_category(self, category: str, limit: int = 10) -> List[Script]:
        """
        Obtiene scripts populares por categoría.

        La "popularidad" puede determinarse por:
        - Número de usos
        - Ratings de usuarios  
        - Engagement metrics
        - Fecha de creación (más recientes)

        Args:
            category (str): Categoría del script
            limit (int): Número máximo de scripts a retornar

        Returns:
            List[Script]: Lista de scripts populares en la categoría

        Example:
            popular = await repo.get_popular_by_category("viral", limit=5)
        """
        pass

    # ============= BÚSQUEDAS VECTORIALES (EMBEDDINGS) =============

    @abstractmethod
    async def get_similar_scripts(self, embedding: List[float], limit: int = 5) -> List[Script]:
        """
        Obtiene scripts similares usando búsqueda vectorial con embeddings.

        Utiliza técnicas como:
        - Distancia coseno
        - Búsqueda de vecinos más cercanos (KNN)
        - pgvector (si usa PostgreSQL)

        Args:
            embedding (List[float]): Vector de embedding del script (típicamente 384 o 768 dimensiones)
            limit (int): Número máximo de scripts similares a retornar

        Returns:
            List[Script]: Lista de scripts similares ordenados por similitud (más similar primero)

        Example:
            similar = await repo.get_similar_scripts(script.embedding, limit=3)
        """
        pass

    @abstractmethod
    async def update_embedding(self, script_id: str, embedding: List[float]) -> bool:
        """
        Actualiza el embedding vectorial de un script.

        Útil para:
        - Procesamiento batch de embeddings
        - Re-cálculo de embeddings con nuevos modelos
        - Optimización de búsquedas

        Args:
            script_id (str): ID del script a actualizar
            embedding (List[float]): Nuevo vector de embedding

        Returns:
            True si la actualización fue exitosa, False si falló

        Example:
            success = await repo.update_embedding("script123", new_embedding)
        """
        pass

    @abstractmethod
    async def get_scripts_without_embeddings(self, limit: int = 100) -> List[Script]:
        """
        Obtiene scripts que no tienen embeddings para procesamiento batch.

        Útil para:
        - Procesamiento periódico de embeddings
        - Migración de datos
        - Optimización de búsquedas

        Args:
            limit (int): Número máximo de scripts a retornar

        Returns:
            List[Script]: Lista de scripts sin embeddings

        Example:
            # Procesar scripts sin embeddings
            pending = await repo.get_scripts_without_embeddings(50)
            for script in pending:
                embedding = await ai_service.generate_embedding(script.enhanced_text)
                await repo.update_embedding(script.id, embedding)
        """
        pass

    # ============= MÉTODOS DE UTILIDAD =============

    async def get_statistics(self, user_id: Optional[str] = None) -> dict:
        """
        Obtiene estadísticas de scripts.

        Args:
            user_id (Optional[str]): Filtrar por usuario específico (opcional)

        Returns:
            dict: Diccionario con estadísticas

        Implementation Note:
        Este método tiene una implementación por defecto pero puede ser sobrescrito.
        """
        if user_id:
            total = await self.count_by_user(user_id)
            recent = await self.get_recent_by_user(user_id, 7)
            return {
                "total_scripts": total,
                "scripts_this_week": len(recent),
                "user_id": user_id
            }
        else:
            # Implementación básica para todos los usuarios
            # Ajustar según necesidades
            all_scripts = await self.get_all(limit=1000)
            return {
                "total_scripts": len(all_scripts),
                "scripts_with_embeddings": len([s for s in all_scripts if s.embedding]),
                "scripts_enhanced": len([s for s in all_scripts if s.enhanced_text])
            }

    # ============= MÉTODOS ESPECÍFICOS PARA IMPLEMENTACIONES =============

    # Estos métodos pueden ser implementados opcionalmente según el tipo de repositorio:

    def supports_vector_search(self) -> bool:
        """
        Indica si el repositorio soporta búsqueda vectorial.

        Returns:
            True si soporta embeddings, False si no

        Implementation Note:
        - InMemoryScriptRepository: False (búsqueda básica)
        - SupabaseScriptRepository: True (con pgvector)
        - ElasticsearchScriptRepository: True (con dense_vector)
        """
        return False

    def supports_full_text_search(self) -> bool:
        """
        Indica si el repositorio soporta búsqueda de texto completo.

        Returns:
            True si soporta FTS, False si no
        """
        return False

    async def reindex_search(self) -> bool:
        """
        Re-indexa los scripts para búsqueda (si es necesario).

        Returns:
            True si el re-indexado fue exitoso

        Implementation Note:
        Solo relevante para implementaciones que usen índices externos.
        """
        return True

    # ============= VALIDACIONES Y CONSTRAINTS =============

    async def validate_script_ownership(self, script_id: str, user_id: str) -> bool:
        """
        Valida que un script pertenece a un usuario.

        Args:
            script_id (str): ID del script
            user_id (str): ID del usuario

        Returns:
            True si el script pertenece al usuario

        Example:
            if await repo.validate_script_ownership(script_id, user_id):
                # Usuario puede editar el script
                pass
        """
        script = await self.get_by_id(script_id)
        return script is not None and script.user_id == user_id

    async def can_user_create_script(self, user_id: str) -> bool:
        """
        Valida si un usuario puede crear más scripts (límites de plan).

        Args:
            user_id (str): ID del usuario

        Returns:
            True si el usuario puede crear más scripts

        Implementation Note:
        La lógica específica depende del plan del usuario y límites del negocio.
        """
        # Implementación básica - puede ser sobrescrita
        user_scripts = await self.count_by_user(user_id)
        return user_scripts < 1000  # Límite por defecto
