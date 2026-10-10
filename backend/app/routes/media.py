from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Path, Query, Response, Body
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from app.db.config.supabase import supabase
from app.schemas.media import MediaFile, CreateMediaFileDTO
from app.services.media_service import MediaService
from app.core.config import settings
import traceback
import json
from datetime import datetime
import decimal
import requests
import os
from pathlib import Path as PathLib
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
media_service = MediaService()

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        return MediaService.serialize_value(obj)

def custom_json_dumps(obj: Any) -> str:
    return json.dumps(obj, cls=CustomJSONEncoder)

def convert_duration_to_int(duration_str: str) -> int:
    """Convert duration string to integer, handling both formats (with/without 's' suffix)."""
    try:
        # Remove 's' suffix if present and convert to float first to handle decimal values
        duration_str = str(duration_str).rstrip('s')
        return int(float(duration_str))
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid duration format: {duration_str}")

def serialize_value(value: Any) -> Any:
    """Serialize various data types to JSON-compatible format."""
    if isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, decimal.Decimal):
        return float(value)
    elif isinstance(value, (dict, list)):
        return json.loads(json.dumps(value))
    return value

class MediaResponse(BaseModel):
    id: str
    title: str
    duration: float
    file_size: str
    type: str
    thumbnail_url: Optional[str] = None
    aspect_ratio: Optional[str] = None
    created_at: str
    updated_at: str

class MediaDeleteResponse(BaseModel):
    message: str

@router.get("/", response_model=List[MediaFile])
async def get_media_files(type: Optional[str] = Query(None, enum=['video', 'audio'])):
    """Get all media files. Optionally filter by type (video or audio)."""
    try:
        return await media_service.get_media_files(type)
    except Exception as e:
        print(f"Error in get_media_files: {str(e)}")  # Error log
        print(f"Traceback: {traceback.format_exc()}")  # Add traceback for more detail
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sample")
async def get_sample_media(type: Optional[str] = None):
    """
    Get sample media files from the database.
    If type is specified, returns only that type of media.
    """
    try:
        if type and type not in ['video', 'audio']:
            raise HTTPException(status_code=400, detail="Invalid media type")
        
        if type == 'video':
            # For videos, use the videos table
            result = supabase.table('videos').select('*').eq('type', 'sample').execute()
            if result.data:
                for item in result.data:
                    item['duration'] = convert_duration_to_int(item['duration'])
            return result.data or []
        elif type == 'audio':
            # For audio, use the audio table
            result = supabase.table('audio').select('*').eq('type', 'sample').execute()
            if result.data:
                for item in result.data:
                    item['duration'] = convert_duration_to_int(item['duration'])
            return result.data or []
        else:
            # If no type specified, fetch both sample videos and audio
            videos = supabase.table('videos').select('*').eq('type', 'sample').execute()
            audio = supabase.table('audio').select('*').eq('type', 'sample').execute()
            all_media = []
            if videos.data:
                for item in videos.data:
                    item['duration'] = convert_duration_to_int(item['duration'])
                all_media.extend(videos.data)
            if audio.data:
                for item in audio.data:
                    item['duration'] = convert_duration_to_int(item['duration'])
                all_media.extend(audio.data)
            return all_media
            
    except Exception as e:
        print(f"Error in get_sample_media: {str(e)}")  # Error log
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{type}/{id}", response_model=MediaResponse)
async def get_media_file(type: str, id: str):
    """Get a specific media file by type and ID."""
    try:
        if type not in ['video', 'audio']:
            raise HTTPException(status_code=400, detail="Invalid media type")
            
        if type == 'video':
            media_data = await media_service.get_video(id)
        else:
            media_data = await media_service.get_audio(id)
                
        return media_data
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        if "Invalid ID format" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    title: str = Form(...),
    type: str = Form(...),
    duration: str = Form(...),
    thumbnail_url: Optional[str] = Form(None)
):
    try:
        if type not in ['video', 'audio']:
            raise HTTPException(status_code=400, detail="Invalid media type")

        file_content = await file.read()
        file_size = len(file_content)

        metadata = CreateMediaFileDTO(
            title=title,
            duration=duration,
            thumbnail_url=thumbnail_url if type == 'video' else None,
            file_size=f"{file_size / (1024 * 1024):.1f} MB",
            type=type
        )

        result = await media_service.upload_media(
            file=file_content,
            filename=file.filename,
            type=type,
            metadata=metadata
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{type}", response_model=MediaFile)
async def create_media_file(type: str, media: CreateMediaFileDTO):
    """
    Create a new media file record.
    """
    try:
        table_name = f"{type}s" if type == 'video' else 'audio'
        # Set type to 'draft' for new media files
        media_data = {**media.dict(), 'type': 'draft'}
        result = supabase.table(table_name).insert(media_data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{type}/{id}", response_model=MediaResponse)
async def update_media_file(type: str, id: str, media: CreateMediaFileDTO):
    """Update a media file's metadata."""
    try:
        if type not in ['video', 'audio']:
            raise HTTPException(status_code=400, detail="Invalid media type")
            
        return await media_service.update_media_file(type, id, media)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{type}/{id}", response_model=MediaDeleteResponse)
async def delete_media_file(type: str, id: str):
    """Delete a media file."""
    try:
        if type not in ['video', 'audio']:
            raise HTTPException(status_code=400, detail="Invalid media type")
            
        return await media_service.delete_media_file(type, id)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{id}")
async def get_video(id: str):
    """
    Get a specific video by ID from the videos table.
    """
    try:
        # Select all columns including segments
        result = supabase.table('videos').select('*').eq('id', id).execute()
        
        if not result.data or len(result.data) == 0:
            return JSONResponse(
                content={"message": "Video not found"},
                status_code=404
            )
        
        # Convert duration to integer and process segments
        video_data = result.data[0]
        
        # Serialize all values to JSON-compatible format
        serialized_data = {}
        for key, value in video_data.items():
            try:
                serialized_data[key] = serialize_value(value)
            except Exception as e:
                serialized_data[key] = None
        
        # Convert duration if present
        try:
            if 'duration' in serialized_data and serialized_data['duration'] is not None:
                serialized_data['duration'] = convert_duration_to_int(str(serialized_data['duration']))
        except Exception as e:
            serialized_data['duration'] = None
        
        return JSONResponse(content=serialized_data)
        
    except Exception as e:
        if "Invalid input syntax for type uuid" in str(e):
            return JSONResponse(
                content={"message": "Invalid ID format"},
                status_code=400
            )
        
        return JSONResponse(
            content={"message": f"Internal server error: {str(e)}"},
            status_code=500
        )

@router.get("/audio/{id}")
async def get_audio(id: str):
    """
    Get a specific audio by ID from the audio table.
    """
    try:
        result = supabase.table('audio').select('*').eq('id', id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Audio not found")
        
        # Convert duration to integer
        audio_data = result.data[0]
        if 'duration' in audio_data:
            audio_data['duration'] = convert_duration_to_int(str(audio_data['duration']))
            
        return audio_data
    except Exception as e:
        if "Invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        raise HTTPException(status_code=500, detail=str(e))


    """
    Concatenate video segments for a specific video ID and return the URL of the concatenated video.
    """
    try:
        # Get video data
        result = supabase.table('videos').select('*').eq('id', id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_data = result.data[0]
        segments = video_data.get('segments', [])
        
        if not segments:
            raise HTTPException(status_code=400, detail="No segments found for this video")
        
        # Create output directory path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(settings.VIDEOS_DIR, f"{id}_{timestamp}")
        segments_dir = os.path.join(output_dir, "segments")
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(segments_dir, exist_ok=True)
        
        # Initialize segment service
        from app.services.segment_service import SegmentService
        segment_service = SegmentService()
        
        # Process each segment
        segment_paths = []
        updated_segments = []
        for segment in segments:
            # Check if segment already has a video URL
            segment_url = segment.get('url')
            if segment_url and segment_url.startswith('/static/'):
                # Convert relative URL to absolute path
                segment_url = segment_url[7:]  # Remove /static/ prefix
                full_path = os.path.join(settings.STATIC_DIR, segment_url)
                if os.path.exists(full_path):
                    segment_paths.append(full_path)
                    updated_segments.append(segment)
                    continue
            
            # If no valid video URL, create segment from image
            if segment.get('mediaUrls') and len(segment['mediaUrls']) > 0:
                # Download the first image
                from app.services.image_service import ImageService
                image_service = ImageService()
                image_path = image_service.download_image(segment['mediaUrls'][0], PathLib(segments_dir))
                
                if not image_path:
                    print(f"Failed to download image for segment")
                    continue
                
                try:
                    # Create video segment
                    segment_path = await segment_service.create_video_segment(
                        text=segment['speech'],
                        image_path=str(image_path),
                        duration=segment['duration'],
                        output_dir=segments_dir,
                        add_subtitles=True
                    )
                    
                    # Update segment with video URL
                    relative_path = os.path.relpath(segment_path, settings.STATIC_DIR)
                    segment['url'] = f"/static/{relative_path}"
                    updated_segments.append(segment)
                    segment_paths.append(segment_path)
                    
                except Exception as e:
                    print(f"Error creating segment: {str(e)}")
                    continue
        
        if not segment_paths:
            raise HTTPException(status_code=400, detail="No valid segment files found")
        
        # Update segments in database
        update_data = {
            'segments': updated_segments,
            'updated_at': datetime.now().isoformat()
        }
        supabase.table('videos').update(update_data).eq('id', id).execute()
        
        # Concatenate segments
        output_path = await segment_service.concatenate_segments(segment_paths, output_dir)
        
        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to create concatenated video")
        
        # Update video URL in database
        relative_path = os.path.relpath(output_path, settings.STATIC_DIR)
        file_url = f"/static/{relative_path}"
        
        update_data = {
            'file_url': file_url,
            'updated_at': datetime.now().isoformat()
        }
        
        supabase.table('videos').update(update_data).eq('id', id).execute()
        
        return JSONResponse(content={'file_url': file_url})
        
    except Exception as e:
        print(f"Error in concatenate_video_segments: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 