import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = "Video Generation API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Debug mode")
    ENVIRONMENT: str = Field(default="development", description="Environment")

    # API Configuration
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    API_V1_PREFIX: str = "/api/v1"

    # CORS Configuration
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Allowed CORS origins (comma-separated)"
    )

    # OpenAI Configuration
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="OpenAI model")

    # Supabase Configuration
    SUPABASE_URL: str = Field(default="", description="Supabase URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase anonymous key")

    # Script Enhancement Configuration
    MAX_SCRIPT_LENGTH: int = Field(default=2000, description="Maximum script length")
    TARGET_DURATION_MIN: int = Field(default=15, description="Minimum duration in seconds")
    TARGET_DURATION_MAX: int = Field(default=60, description="Maximum duration in seconds")
    WORDS_PER_SECOND: float = Field(default=2.0, description="Average speech rate")

    # Clip Selection Configuration
    DEFAULT_SIMILARITY_THRESHOLD: float = Field(default=0.3, description="Default similarity threshold")
    DEFAULT_QUALITY_THRESHOLD: float = Field(default=3.0, description="Default quality threshold")
    MAX_CLIPS_PER_SELECTION: int = Field(default=20, description="Maximum clips per selection")
    CLIP_CACHE_TTL_SECONDS: int = Field(default=3600, description="Clip cache TTL in seconds")

    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = Field(default=50, description="Maximum file size in MB")
    UPLOAD_PATH: str = Field(default="uploads/", description="Upload directory path")

    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def openai_configured(self) -> bool:
        """Check if OpenAI is properly configured"""
        return bool(self.OPENAI_API_KEY and self.OPENAI_API_KEY.startswith("sk-"))

    @property
    def supabase_configured(self) -> bool:
        """Check if Supabase is properly configured"""
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS


# Global settings instance
settings = Settings()