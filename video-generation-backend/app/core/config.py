import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Settings centralizadas usando Pydantic v2."""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

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
        default="http://localhost:3000,http://localhost:3001",
        description="Allowed CORS origins (comma-separated)"
    )

    # OpenAI Configuration
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="OpenAI model")
    TEMPERATURE: float = Field(default=0.7, description="OpenAI temperature")
    MAX_TOKENS: int = Field(default=1500, description="Max tokens for OpenAI")

    # Supabase Configuration
    SUPABASE_URL: str = Field(default="", description="Supabase URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase anonymous key")
    SUPABASE_JWT_SECRET: str = Field(default="", description="Supabase JWT secret")

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

    # Embedding Configuration
    EMBEDDING_MODEL: str = Field(default="all-mpnet-base-v2", description="Embedding model")
    EMBEDDING_DIMENSION: int = Field(default=768, description="Embedding dimension")

    # TTS Configuration
    TTS_MODEL: str = Field(default="gpt-4o-mini-tts", description="TTS model")

    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = Field(default=50, description="Maximum file size in MB")
    UPLOAD_PATH: str = Field(default="uploads/", description="Upload directory path")

    # Security Configuration
    SECRET_KEY: str = Field(default="", description="Secret key for JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiration")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")

    # Rate Limiting Configuration
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Rate limit per minute")
    RATE_LIMIT_BURST: int = Field(default=10, description="Rate limit burst")

    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )

    # Database Configuration
    DATABASE_URL: str = Field(default="sqlite:///./video_generation.db", description="Database URL")
    DATABASE_POOL_SIZE: int = Field(default=5, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, description="Database max overflow connections")

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

    @property
    def jwt_configured(self) -> bool:
        """Check if JWT is properly configured"""
        return bool(self.SECRET_KEY and self.SUPABASE_JWT_SECRET)

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() in ["development", "dev"]

    @property
    def is_testing(self) -> bool:
        """Check if running in testing environment"""
        return self.ENVIRONMENT.lower() in ["testing", "test"]


# Global settings instance
settings = Settings()