"""
Audio Service Interface
"""
from abc import ABC, abstractmethod


class AudioService(ABC):
    """Interfaz para servicios de audio."""

    @abstractmethod
    async def generate_speech(
        self,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0
    ) -> bytes:
        """Genera audio a partir de texto."""
        pass

    @abstractmethod
    async def transcribe_audio(self, audio_data: bytes) -> str:
        """Transcribe audio a texto."""
        pass
