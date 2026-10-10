from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
import logging
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "ContentMate API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS - Allow all origins
    BACKEND_CORS_ORIGINS: List[str] = ["*"]  # Allow all origins
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-pro"
    UNSPLASH_API_KEY: str = os.getenv("UNSPLASH_API_KEY", "")
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    APP_DIR: Path = BASE_DIR
    STATIC_DIR: Path = APP_DIR / "static"
    UPLOADS_DIR: Path = STATIC_DIR / "uploads"
    VIDEOS_DIR: Path = STATIC_DIR / "videos"
    IMAGES_DIR: Path = STATIC_DIR / "images"
    AUDIO_DIR: Path = STATIC_DIR / "audio"
    
    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    SUPABASE_DB_URL: str = os.getenv("SUPABASE_DB_URL", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings():
    settings = Settings()
    logger.info("Settings loaded successfully")
    return settings

settings = get_settings()

# Create necessary directories
settings.APP_DIR.mkdir(parents=True, exist_ok=True)
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True) 