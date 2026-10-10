from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import decimal
from fastapi.responses import JSONResponse
from app.db.config.supabase import supabase
from app.schemas.media import MediaFile, CreateMediaFileDTO
from app.services.segment_service import SegmentService

class MediaService:
    def __init__(self):
        self.segment_service = SegmentService()

    @staticmethod
    def convert_duration_to_int(duration_str: str) -> int:
        """Convert duration string to integer, handling both formats (with/without 's' suffix)."""
        try:
            # Remove 's' suffix if present and convert to float first to handle decimal values
            duration_str = str(duration_str).rstrip('s')
            return int(float(duration_str))
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid duration format: {duration_str}")

    @staticmethod
    def serialize_value(value: Any) -> Any:
        """Serialize various data types to JSON-compatible format."""
        if isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, decimal.Decimal):
            return float(value)
        elif isinstance(value, (dict, list)):
            return json.loads(json.dumps(value))
        return value

    async def get_media_files(self, type: Optional[str] = None) -> List[dict]:
        """Get all media files with optional type filter."""
        try:
            if type == 'video':
                result = supabase.table('videos').select('*').in_('type', ['DRAFT', 'GENERATED']).execute()
                if not result.data:
                    return []
                
                for item in result.data:
                    item['duration'] = self.convert_duration_to_int(item['duration'])
                    # Get segments for each video
                    segments = await self.segment_service.get_video_segments(item['id'])
                    item['segments'] = segments
                return result.data

            elif type == 'audio':
                result = supabase.table('audio').select('*').in_('type', ['DRAFT', 'GENERATED']).execute()
                if not result.data:
                    return []
                for item in result.data:
                    item['duration'] = self.convert_duration_to_int(item['duration'])
                    item['segments'] = []  # Initialize empty segments for audio
                return result.data

            else:
                # Fetch both videos and audio
                videos = supabase.table('videos').select('*').in_('type', ['DRAFT', 'GENERATED']).execute()
                audio = supabase.table('audio').select('*').in_('type', ['DRAFT', 'GENERATED']).execute()
                all_media = []
                
                if videos.data:
                    for item in videos.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                        segments = await self.segment_service.get_video_segments(item['id'])
                        item['segments'] = segments
                    all_media.extend(videos.data)
                
                if audio.data:
                    for item in audio.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                        item['segments'] = []
                    all_media.extend(audio.data)
                
                return all_media

        except Exception as e:
            raise e

    async def get_sample_media(self, type: Optional[str] = None) -> List[dict]:
        """Get sample media files with optional type filter."""
        try:
            if type == 'video':
                result = supabase.table('videos').select('*').eq('type', 'sample').execute()
                if result.data:
                    for item in result.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                return result.data or []

            elif type == 'audio':
                result = supabase.table('audio').select('*').eq('type', 'sample').execute()
                if result.data:
                    for item in result.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                return result.data or []

            else:
                videos = supabase.table('videos').select('*').eq('type', 'sample').execute()
                audio = supabase.table('audio').select('*').eq('type', 'sample').execute()
                all_media = []
                if videos.data:
                    for item in videos.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                    all_media.extend(videos.data)
                if audio.data:
                    for item in audio.data:
                        item['duration'] = self.convert_duration_to_int(item['duration'])
                    all_media.extend(audio.data)
                return all_media

        except Exception as e:
            raise e

    async def get_video(self, id: str) -> Dict:
        """Get a specific video by ID with its segments."""
        try:
            # Get video data
            result = supabase.table('videos').select('*').eq('id', id).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("Video not found")
            
            video_data = result.data[0]
            
            # Convert duration to integer
            if 'duration' in video_data:
                try:
                    duration_str = str(video_data['duration']).rstrip('s')
                    video_data['duration'] = int(float(duration_str))
                except (ValueError, TypeError):
                    video_data['duration'] = 0
            
            # Get segments for this video
            segments = await self.segment_service.get_video_segments(id)
            video_data['segments'] = segments
            
            return video_data

        except Exception as e:
            if "Invalid input syntax for type uuid" in str(e):
                raise ValueError("Invalid ID format")
            raise e

    async def get_audio(self, id: str) -> dict:
        """Get a specific audio by ID."""
        result = supabase.table('audio').select('*').eq('id', id).execute()
        
        if not result.data or len(result.data) == 0:
            raise ValueError("Audio not found")
        
        audio_data = result.data[0]
        if 'duration' in audio_data:
            audio_data['duration'] = self.convert_duration_to_int(str(audio_data['duration']))
            
        return audio_data

    async def create_media_file(self, type: str, media: CreateMediaFileDTO) -> dict:
        """Create a new media file record."""
        table_name = f"{type}s" if type == 'video' else 'audio'
        media_data = {**media.dict(), 'type': 'generated'}
        result = supabase.table(table_name).insert(media_data).execute()
        return result.data[0]

    async def update_media_file(self, type: str, id: str, media: CreateMediaFileDTO) -> Dict:
        """Update a media file record."""
        try:
            table_name = f"{type}s" if type == 'video' else 'audio'
            
            # Get current media data
            result = supabase.table(table_name).select('*').eq('id', id).execute()
            
            if not result.data:
                raise ValueError(f"{type.capitalize()} not found")
            
            # Update the timestamp
            update_data = media.dict()
            update_data['updated_at'] = datetime.now().isoformat()
            
            # Update in database
            result = supabase.table(table_name).update(update_data).eq('id', id).execute()
            
            if not result.data:
                raise ValueError(f"Failed to update {type}")
            
            media_data = result.data[0]
            
            # Convert duration to integer
            if 'duration' in media_data:
                try:
                    duration_str = str(media_data['duration']).rstrip('s')
                    media_data['duration'] = int(float(duration_str))
                except (ValueError, TypeError):
                    media_data['duration'] = 0
            
            return media_data

        except Exception as e:
            raise ValueError(f"Failed to update {type}: {str(e)}")

    async def delete_media_file(self, type: str, id: str) -> Dict[str, str]:
        """Delete a media file record."""
        try:
            table_name = f"{type}s" if type == 'video' else 'audio'
            result = supabase.table(table_name).delete().eq('id', id).execute()
            
            if not result.data:
                raise ValueError(f"{type.capitalize()} not found")
                
            return {"message": f"{type.capitalize()} deleted successfully"}

        except Exception as e:
            raise ValueError(f"Failed to delete {type}: {str(e)}") 