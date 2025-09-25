"""
AI Service Interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.domain.entities.script import Script


class AIService(ABC):
    """
    Interfaz para servicios de IA.

    Se definen los metodos:
    - enhance_script: Mejora un script usando IA.
    - generate_keywords: Genera keywords SEO para un texto.
    - generate_embedding: Genera embedding vectorial para un texto.
    """

    @abstractmethod
    async def enhance_script(
        self,
        script: Script
    ) -> Dict[str, Any]:
        """
        Mejora un script usando IA.

        Args:
            script (Script): El script a mejorar.

        Returns:
            Dict[str, Any]: El script mejorado.
        """
        pass

    @abstractmethod
    async def generate_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Genera keywords SEO para un texto."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Genera embedding vectorial para un texto."""
        pass
