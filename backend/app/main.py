from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

from app.routes import media, video, audio, resources, image
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = Path(__file__).parent / "static"
templates_path = Path(__file__).parent / "templates"
uploads_path = Path(__file__).parent / "uploads"

# Create necessary directories
static_path.mkdir(parents=True, exist_ok=True)
templates_path.mkdir(parents=True, exist_ok=True)
uploads_path.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Configure templates
templates = Jinja2Templates(directory=templates_path)

# Include routers
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
app.include_router(image.router, prefix="/api/image", tags=["image"])

# Root route
@app.get("/")
async def root():
    return {"message": "Welcome to ContentMate API"} 