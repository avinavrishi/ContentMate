from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.video_service import VideoService
from app.db.config.supabase import supabase
from datetime import datetime
from pathlib import Path
import re
from moviepy.editor import VideoFileClip
from app.core.config import settings
import json
import decimal
import traceback
from app.services.segment_service import SegmentService
import os
from app.services.image_service import ImageService

router = APIRouter()
video_service = VideoService()

def get_segment_service() -> SegmentService:
    """Dependency to get SegmentService instance."""
    return SegmentService()

class PromptAnalysisRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    shouldSummarize: Optional[bool] = False
    maxWords: Optional[int] = 200
    resources: Optional[List[str]] = None

class VideoCustomizations(BaseModel):
    stockMedia: bool = False
    aiMedia: bool = False
    aiMediaStyle: Optional[str] = None
    aiAvatar: bool = False
    brandKit: bool = False
    bRoll: bool = False
    soundEffects: bool = False
    headings: bool = False
    subtitles: bool = True

class VideoCreationRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    duration: float = Field(..., ge=1, le=60)
    tone: str
    purpose: str
    audience: str
    aspectRatio: str = Field(..., pattern="^(9:16|1:1|16:9)$")
    language: str
    dialect: str
    customizations: VideoCustomizations
    resources: Optional[List[str]] = None

class PromptAnalysisResponse(BaseModel):
    tone: List[str]
    purpose: List[str]
    audience: List[str]
    summarizedScript: Optional[str] = None

class VideoCreationResponse(BaseModel):
    """Response model for video creation endpoint."""
    status: str
    video_id: str

class VideoEditRequest(BaseModel):
    segments: Optional[List[Dict[str, Any]]] = None
    thumbnail_url: Optional[str] = None
    aspect_ratio: Optional[str] = None
    language: Optional[str] = None
    dialect: Optional[str] = None
    gap_between_scenes: Optional[float] = None

class VideoSegment(BaseModel):
    id: int
    speech: str
    duration: Optional[float] = None
    mediaPrompt: Optional[str] = None
    mediaUrls: Optional[List[str]] = []
    url: Optional[str] = None
    sequenceId: Optional[int] = None

class VideoResponse(BaseModel):
    id: str
    title: str
    duration: float
    file_size: str
    type: str
    thumbnail_url: Optional[str] = None
    aspect_ratio: Optional[str] = None
    created_at: str
    updated_at: str

class VideoDeleteResponse(BaseModel):
    message: str

class SegmentEditRequest(BaseModel):
    speech: Optional[str] = None
    mediaPrompt: Optional[str] = None
    mediaUrls: Optional[List[str]] = None

class SegmentSequence(BaseModel):
    id: str
    sequenceId: int

class SequenceUpdateRequest(BaseModel):
    sequences: List[SegmentSequence]

class SegmentCreateRequest(BaseModel):
    speech: str = Field(..., min_length=1)
    duration: float = Field(..., ge=1, le=60)

class ExportRequest(BaseModel):
    segments: List[Dict[str, Any]]

def generate_title_from_prompt(prompt: str) -> str:
    """Generate a meaningful title from the prompt."""
    # Remove special characters and extra spaces
    clean_prompt = re.sub(r'[^\w\s]', ' ', prompt)
    words = clean_prompt.split()
    
    # Take first 6-8 words for title
    title_words = words[:min(8, len(words))]
    title = ' '.join(title_words).title()
    
    return title

def create_thumbnail(video_path: str, output_dir: Path) -> str:
    """Create a thumbnail from the video using moviepy."""
    try:
        # Load the video
        video = VideoFileClip(video_path)
        
        # Get a frame from 25% of the video duration
        frame_time = video.duration * 0.25
        
        # Extract the frame
        frame = video.get_frame(frame_time)
        
        # Generate thumbnail filename
        thumbnail_filename = f"thumbnail_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        thumbnail_path = output_dir / thumbnail_filename
        
        # Save the frame as an image
        video.save_frame(str(thumbnail_path), t=frame_time)
        
        # Close the video to free up resources
        video.close()
        
        # Return the relative path
        return f"/static/{thumbnail_path.name}"
        
    except Exception as e:
        print(f"Error creating thumbnail: {str(e)}")
        return ""

def serialize_value(value: Any) -> Any:
    """Serialize various data types to JSON-compatible format."""
    if isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, decimal.Decimal):
        return float(value)
    elif isinstance(value, (dict, list)):
        return json.loads(json.dumps(value))
    return value

@router.post("/analyze-prompt", response_model=PromptAnalysisResponse)
async def analyze_prompt(request: PromptAnalysisRequest):
    """Analyze the video prompt and suggest tone, purpose, and audience options."""
    try:
        return video_service.analyze_prompt(
            request.prompt,
            request.shouldSummarize,
            request.maxWords,
            request.resources
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create", response_model=VideoCreationResponse)
async def create_video(request: VideoCreationRequest):
    """Create a video based on the provided parameters."""
    try:
        return await video_service.create_video(request.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-resource")
async def upload_resource(file: UploadFile = File(...)):
    """Upload a resource file for video creation."""
    try:
        file_content = await file.read()
        return await video_service.upload_resource(file_content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=VideoResponse)
async def get_video(id: str):
    """Get a specific video by ID."""
    try:
        return await video_service.get_video(id)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        if "Invalid ID format" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}/edit", response_model=VideoResponse)
async def edit_video(id: str, edit_request: VideoEditRequest):
    """Edit a video's metadata."""
    try:
        return await video_service.edit_video(id, edit_request.dict(exclude_unset=True))
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}", response_model=VideoDeleteResponse)
async def delete_video(id: str):
    """Delete a video."""
    try:
        return await video_service.delete_video(id)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/segments", response_model=List[VideoSegment])
async def get_video_segments(id: str):
    """Get all segments for a specific video."""
    try:
        segment_service = SegmentService()
        segments = await segment_service.get_video_segments(id)
        return segments
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{video_id}/segments/sequence", response_model=bool)
async def update_segments_sequence(
    video_id: str,
    request: SequenceUpdateRequest,
    segment_service: SegmentService = Depends(get_segment_service)
):
    """Update the sequence of segments for a video."""
    try:
        return await segment_service.update_segment_sequence(video_id, [seq.dict() for seq in request.sequences])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{video_id}/segments/{segment_id}", response_model=VideoSegment)
async def edit_segment(video_id: str, segment_id: int, edit_request: SegmentEditRequest):
    """Edit a segment and regenerate it with new content."""
    try:
        segment_service = SegmentService()
        
        # Update segment with new values
        update_data = edit_request.dict(exclude_unset=True)
        
        # Regenerate segment with new content
        updated_segment = await segment_service.regenerate_segment(
            video_id=video_id,
            segment_id=segment_id,
            speech=update_data.get('speech'),
            media_prompt=update_data.get('mediaPrompt'),
            media_urls=update_data.get('mediaUrls')
        )
        
        return updated_segment
        
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error editing segment: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{video_id}/segments", response_model=VideoSegment)
async def create_segment(
    video_id: str,
    request: SegmentCreateRequest,
    segment_service: SegmentService = Depends(get_segment_service)
):
    """Create a new segment for a video."""
    try:
        # Get max sequence_id for this video to append the new segment at the end
        segments = await segment_service.get_video_segments(video_id)
        max_sequence = max([s.get('sequenceId', 0) for s in segments]) if segments else 0
        
        # Create output directories for the new segment
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(settings.VIDEOS_DIR, timestamp, "segments")
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate a default image for the new segment
        image_handler = ImageService()
        media_prompt = f"Create a visual representation for: {request.speech}"
        media_urls = image_handler.search_images(media_prompt)
        
        if not media_urls:
            raise HTTPException(status_code=500, detail="Failed to generate image for segment")
        
        # Download the first image
        image_path = image_handler.download_image(media_urls[0], Path(output_dir))
        if not image_path:
            raise HTTPException(status_code=500, detail="Failed to download image for segment")
        
        # Create video segment with image and speech
        segment_path = await segment_service.create_video_segment(
            text=request.speech,
            image_path=str(image_path),
            duration=request.duration,
            output_dir=output_dir,
            add_subtitles=True
        )
        
        if not segment_path or not os.path.exists(segment_path):
            raise HTTPException(status_code=500, detail="Failed to create video segment")
        
        # Get relative path for segment URL
        static_dir = Path(settings.STATIC_DIR)
        try:
            relative_path = Path(segment_path).relative_to(static_dir)
            segment_url = f"/static/{relative_path}"
        except ValueError:
            segment_url = f"/static/videos/{timestamp}/segments/{os.path.basename(segment_path)}"
        
        # Create segment data
        segment_data = {
            'speech': request.speech,
            'duration': request.duration,
            'sequence_id': max_sequence + 1,  # Append at the end
            'media_prompt': media_prompt,
            'media_urls': media_urls,
            'url': segment_url
        }
        
        # Create the segment in database
        new_segment = await segment_service.create_segment(video_id, segment_data)
        if not new_segment:
            raise HTTPException(status_code=500, detail="Failed to create segment record")
            
        return new_segment
    except Exception as e:
        print(f"Error creating segment: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{video_id}/segments/{segment_id}", response_model=Dict[str, str])
async def delete_segment(
    video_id: str,
    segment_id: int,
    segment_service: SegmentService = Depends(get_segment_service)
):
    """Delete a specific segment."""
    try:
        success = await segment_service.delete_segment(segment_id)
        if not success:
            raise HTTPException(status_code=404, detail="Segment not found")
        return {"message": "Segment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{video_id}/segments/{segment_id}/duplicate", response_model=VideoSegment)
async def duplicate_segment(
    video_id: str,
    segment_id: int,
    segment_service: SegmentService = Depends(get_segment_service)
):
    """Duplicate a specific segment."""
    try:
        # Get the segment to duplicate
        segments = await segment_service.get_video_segments(video_id)
        original_segment = next((s for s in segments if s['id'] == segment_id), None)
        
        if not original_segment:
            raise HTTPException(status_code=404, detail="Segment not found")
        
        # Create new segment with same content
        new_segment = await segment_service.create_segment(
            video_id=video_id,
            segment_data={
                'speech': original_segment['speech'],
                'duration': original_segment['duration'],
                'media_prompt': original_segment.get('mediaPrompt'),
                'media_urls': original_segment.get('mediaUrls', []),
                'url': original_segment.get('url'),
                'sequence_id': len(segments) + 1  # Add at the end
            }
        )
        
        if not new_segment:
            raise HTTPException(status_code=500, detail="Failed to create duplicate segment")
            
        return new_segment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{video_id}/export")
async def export_video(video_id: str, request: ExportRequest):
    """Export a video by concatenating its segments."""
    try:
        # Create output directory for the exported video
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(settings.VIDEOS_DIR, timestamp, "exports")
        os.makedirs(output_dir, exist_ok=True)

        # Get segment paths
        segment_paths = []
        for segment in request.segments:
            # Convert relative URL to absolute path
            relative_path = segment['url'].replace('/static/', '')
            absolute_path = os.path.join(settings.STATIC_DIR, relative_path)
            if os.path.exists(absolute_path):
                segment_paths.append(absolute_path)

        if not segment_paths:
            raise HTTPException(status_code=400, detail="No valid segments found")

        # Concatenate segments
        segment_service = SegmentService()
        output_path = await segment_service.concatenate_segments(
            segment_paths=segment_paths,
            output_dir=output_dir,
            add_crossfade=True
        )

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to create exported video")

        # Get relative path for response
        static_dir = Path(settings.STATIC_DIR)
        try:
            relative_path = Path(output_path).relative_to(static_dir)
            video_url = f"/static/{relative_path}"
        except ValueError:
            video_url = f"/static/videos/{timestamp}/exports/{os.path.basename(output_path)}"

        # Update the file_url in the videos table
        update_data = {
            "file_url": video_url,
            "updated_at": datetime.now().isoformat()
        }
        result = supabase.table('videos').update(update_data).eq('id', video_id).execute()
        
        if not result.data:
            print(f"Warning: Failed to update file_url for video {video_id}")

        return {
            "status": "success",
            "url": video_url
        }

    except Exception as e:
        print(f"Error exporting video: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) 