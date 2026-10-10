from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime

class CreateMediaFileDTO(BaseModel):
    """Data transfer object for creating a media file"""
    title: str
    thumbnail_url: Optional[str] = None  # Only for videos
    duration: str
    file_size: str
    type: str

class MediaFile(BaseModel):
    """Full media file model including database fields"""
    id: str
    title: str
    thumbnail_url: Optional[str] = None
    duration: Union[str, float]  # Can be either string or float
    file_size: str
    type: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True 