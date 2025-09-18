import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4o-mini"

    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # CORS Configuration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # App Configuration
    APP_NAME: str = "Video Generation API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Script Enhancement Configuration
    MAX_SCRIPT_LENGTH: int = 2000
    TARGET_DURATION_MIN: int = 15
    TARGET_DURATION_MAX: int = 60
    WORDS_PER_SECOND: float = 2.0  # Velocidad promedio de habla

    @property
    def openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY and self.OPENAI_API_KEY.startswith("sk-"))


settings = Settings()