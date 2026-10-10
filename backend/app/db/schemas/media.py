from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Segment(BaseModel):
    id: str
    video_id: str
    url: Optional[str] = None
    speech: str
    duration: float
    media_prompt: Optional[str] = None
    media_urls: Optional[List[str]] = []
    created_at: str
    updated_at: str
    sequence_id: Optional[int] = None

class MediaFile(BaseModel):
    id: str
    title: str
    thumbnail_url: Optional[str] = None
    duration: float
    file_size: str
    type: str
    created_at: str
    updated_at: str 