from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from app.services.audio_service import AudioService

router = APIRouter()
audio_service = AudioService()

class AudioCustomizationOptions(BaseModel):
    soundEffects: bool = False
    speed: float = 1.0
    pitch: float = 1.0
    volume: float = 1.0

class AudioCreateRequest(BaseModel):
    script: Optional[str] = None  # Direct script input
    prompt: Optional[str] = None  # Optional prompt for idea-to-audio flow
    duration: int = Field(..., ge=1, le=60)  # Duration between 1 and 60 seconds
    tone: Optional[str] = None
    purpose: Optional[str] = None
    audience: Optional[str] = None
    language: str = "English"
    dialect: str = "US"
    customizations: Optional[AudioCustomizationOptions] = None
    resources: Optional[List[str]] = None

class AudioCreationResponse(BaseModel):
    status: str
    audio_path: str
    script: str

class AudioUpdateRequest(BaseModel):
    title: Optional[str] = None
    duration: Optional[int] = Field(None, ge=1, le=60)
    language: Optional[str] = None
    dialect: Optional[str] = None
    customizations: Optional[AudioCustomizationOptions] = None

class AudioResponse(BaseModel):
    id: str
    title: str
    duration: int
    file_size: str
    type: str
    created_at: str
    updated_at: str

class AudioDeleteResponse(BaseModel):
    message: str

@router.post("/create", response_model=AudioCreationResponse)
async def create_audio(request: AudioCreateRequest):
    """Create an audio file from the provided parameters."""
    try:
        return await audio_service.create_audio(request.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=AudioResponse)
async def get_audio(id: str):
    """Get a specific audio by ID."""
    try:
        return await audio_service.get_audio(id)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        if "Invalid ID format" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=AudioResponse)
async def update_audio(id: str, update_data: AudioUpdateRequest):
    """Update an audio file's metadata."""
    try:
        return await audio_service.update_audio(id, update_data.dict(exclude_unset=True))
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}", response_model=AudioDeleteResponse)
async def delete_audio(id: str):
    """Delete an audio file."""
    try:
        return await audio_service.delete_audio(id)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 