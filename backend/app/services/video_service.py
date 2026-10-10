import json
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from app.core.config import settings
import uuid
from datetime import datetime
from pathlib import Path
import os
from app.services.script_service import ScriptService
from app.services.transformer_service import TransformerService
from app.services.image_service import ImageService
from app.services.segment_service import SegmentService
from app.services.media_service import MediaService
import re
from moviepy.editor import VideoFileClip, ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip, ColorClip
from fastapi.responses import JSONResponse
from app.db.config.supabase import supabase
import decimal
import traceback
import subprocess

# Configure Gemini once at module level
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(settings.GEMINI_MODEL)

class VideoService:
    def __init__(self):
        self.transformer_service = TransformerService()
        self.image_service = ImageService()
        self.segment_service = SegmentService()

    @staticmethod
    def generate_title_from_prompt(prompt: str) -> str:
        """Generate a meaningful title from the prompt."""
        # Remove special characters and extra spaces
        clean_prompt = re.sub(r'[^\w\s]', ' ', prompt)
        words = clean_prompt.split()
        
        # Take first 6-8 words for title
        title_words = words[:min(8, len(words))]
        return ' '.join(title_words).title()

    @staticmethod
    def create_thumbnail(video_path: str, output_dir: Path) -> str:
        """Create a thumbnail from the video."""
        try:
            # Load video
            video = VideoFileClip(video_path)
            
            # Get frame from middle of video
            frame_time = video.duration / 2
            
            # Extract frame and save as thumbnail
            thumbnail_path = output_dir / "thumbnail.jpg"
            video.save_frame(str(thumbnail_path), t=frame_time)
            
            # Close video to free resources
            video.close()
            
            # Return relative path for storage in database
            return f"/static/videos/{output_dir.name}/thumbnail.jpg"
        except Exception as e:
            print(f"Failed to create thumbnail: {str(e)}")
            return None

    def serialize_value(self, value: Any) -> Any:
        """Serialize various data types to JSON-compatible format."""
        return MediaService.serialize_value(value)

    def analyze_prompt(self, prompt: str, should_summarize: bool = False, max_words: int = 200, resources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Analyze the video prompt and suggest tone, purpose, and audience options.
        Also processes any additional resources provided.
        """
        try:
            # Process resources if provided
            additional_context = ""
            if resources:
                additional_context = "\nAdditional context from resources:\n"
                for resource_path in resources:
                    try:
                        with open(resource_path, 'r') as f:
                            content = f.read()
                            additional_context += f"\n{content}\n"
                    except Exception as e:
                        print(f"Error reading resource {resource_path}: {str(e)}")

            # Use ScriptService to analyze the prompt with additional context
            analysis_result = ScriptService.analyze(prompt + additional_context)
            
            # If summarization is requested, get the summary
            summarized_script = None
            if should_summarize:
                summarized_script = ScriptService.summarize(prompt, max_words)
            
            return {
                "tone": analysis_result.get("tone", ["professional", "engaging", "conversational"]),
                "purpose": analysis_result.get("purpose", ["educational", "informative", "explanatory"]),
                "audience": analysis_result.get("audience", ["general", "professionals", "enthusiasts"]),
                "summarizedScript": summarized_script
            }
        except Exception as e:
            print(f"Error analyzing prompt: {str(e)}")
            raise ValueError(f"Error analyzing prompt: {str(e)}")

    @staticmethod
    def summarize_script(script: str, max_words: int = 200) -> str:
        """
        Summarize the given script using ScriptService.
        """
        try:
            return ScriptService.summarize(script, max_words)
        except Exception as e:
            raise ValueError(f"Error summarizing script: {str(e)}")

    @staticmethod
    async def create_video(options: Dict[str, Any]) -> Dict[str, Any]:
        """Create a video based on the provided options."""
        try:
            print("Starting video creation process...")
            
            # Initialize services
            script_service = ScriptService()
            segment_service = SegmentService()
            image_handler = ImageService()
            
            # Create output directories
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_dir = os.path.join(settings.VIDEOS_DIR, timestamp)
            images_dir = os.path.join(output_dir, "images")
            segments_dir = os.path.join(output_dir, "segments")
            os.makedirs(output_dir, exist_ok=True)
            os.makedirs(images_dir, exist_ok=True)
            os.makedirs(segments_dir, exist_ok=True)
            
            # Generate script
            script_prompt = json.dumps({
                "prompt": options['prompt'],
                "duration": options['duration'],
                "tone": options['tone'],
                "purpose": options['purpose'],
                "audience": options['audience'],
                "language": options['language'],
                "dialect": options['dialect'],
                "aspectRatio": options['aspectRatio'],
                "customizations": options['customizations']
            })
            
            content = script_service.generate_script(script_prompt, category="video")
            segments = content.get("segments", [])
            
            if not segments:
                raise ValueError("No segments were created")
            
            # Process each segment
            updated_segments = []
            first_segment_path = None
            total_duration = 0
            
            # Generate title from prompt
            title = VideoService.generate_title_from_prompt(options['prompt'])
            
            # First, search for images for each segment
            for segment in segments:
                # Generate unique media prompt for each segment
                segment['mediaPrompt'] = f"Create a visual representation for: {segment['speech']}"
                
                # Search for images based on this segment's specific mediaPrompt
                media_urls = image_handler.search_images(segment['mediaPrompt'])
                if media_urls:
                    segment['mediaUrls'] = media_urls
                else:
                    print(f"Warning: No media URLs found for segment: {segment['speech']}")
                    segment['mediaUrls'] = []
            
            # Now process segments with images
            for segment in segments:
                if not segment.get('mediaUrls'):
                    print(f"Warning: No media URLs for segment: {segment['speech']}")
                    continue
                
                # Download the first image for this segment
                image_path = image_handler.download_image(segment['mediaUrls'][0], Path(images_dir))
                
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
                    
                    if segment_path and os.path.exists(segment_path):
                        # Store first segment path for thumbnail
                        if first_segment_path is None:
                            first_segment_path = segment_path
                        
                        # Get relative path for segment URL
                        static_dir = Path(settings.STATIC_DIR)
                        try:
                            relative_path = Path(segment_path).relative_to(static_dir)
                            segment['url'] = f"/static/{relative_path}"
                        except ValueError:
                            segment['url'] = f"/static/videos/{timestamp}/segments/{os.path.basename(segment_path)}"
                        updated_segments.append(segment)
                        total_duration += segment['duration']
                    else:
                        print(f"Warning: Invalid segment path created")
                        
                except Exception as e:
                    print(f"Error creating segment: {str(e)}")
                    continue
            
            if not updated_segments:
                raise ValueError("Failed to create any valid video segments")
            
            # Create thumbnail from first segment
            thumbnail_path = None
            if first_segment_path:
                thumbnail_path = VideoService.create_thumbnail(first_segment_path, Path(output_dir))
                if not thumbnail_path:
                    print("Warning: Failed to create thumbnail, proceeding without it")
            
            # Calculate file size from first segment
            file_size = Path(first_segment_path).stat().st_size if first_segment_path else 0
            file_size_mb = f"{file_size / (1024 * 1024):.1f} MB"
            
            # Create video record in database
            video_data = {
                "title": title,
                "thumbnail_url": thumbnail_path,
                "duration": total_duration,  # Use sum of segment durations
                "file_size": file_size_mb,
                "file_url": None,
                "type": "DRAFT",  # Using uppercase to match database enum
                "aspect_ratio": options['aspectRatio'],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            
            result = supabase.table('videos').insert(video_data).execute()
            
            if not result.data:
                raise ValueError("Failed to create video record")
            
            video_id = result.data[0]['id']
            
            # Create segments in database
            segments_to_insert = []
            for idx, segment in enumerate(updated_segments):
                # Create a new dict with only the fields that exist in the database
                segment_data = {
                    'video_id': video_id,
                    'speech': segment['speech'],
                    'duration': segment['duration'],
                    'media_prompt': segment.get('mediaPrompt', ''),
                    'media_urls': segment.get('mediaUrls', []),
                    'url': segment.get('url', ''),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'sequence_id': idx + 1,
                }
                segments_to_insert.append(segment_data)
            
            if segments_to_insert:
                segments_result = supabase.table('segments').insert(segments_to_insert).execute()
                if not segments_result.data:
                    print("Warning: Failed to create segment records")
            
            return {
                "status": "success",
                "video_id": video_id
            }
            
        except Exception as e:
            print(f"Error creating video: {str(e)}")
            traceback.print_exc()
            raise ValueError(f"Failed to create video: {str(e)}")

    @staticmethod
    async def save_resource(file_data: bytes, filename: str) -> str:
        """
        Save an uploaded resource file.
        """
        try:
            # Ensure uploads directory exists
            settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            
            # Generate a unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{timestamp}_{filename}"
            file_path = settings.UPLOADS_DIR / unique_filename
            
            # Save the file
            with open(file_path, "wb") as f:
                f.write(file_data)
            
            return str(file_path)
        except Exception as e:
            raise ValueError(f"Error saving resource: {str(e)}")

    def process_video_segments(self, video_item: dict) -> dict:
        """Process video segments to ensure proper format and data."""
        return self.segment_service.process_video_segments(video_item)

    async def get_video(self, id: str) -> Dict:
        """Get a specific video by ID."""
        try:
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
            
            # Return video data without segments
            return {
                "id": video_data['id'],
                "title": video_data['title'],
                "duration": video_data['duration'],
                "file_size": video_data.get('file_size', '0 MB'),
                "type": video_data.get('type', 'video'),
                "thumbnail_url": video_data.get('thumbnail_url'),
                "aspect_ratio": video_data.get('aspect_ratio', '16:9'),  # Default to 16:9 if not set
                "created_at": video_data['created_at'],
                "updated_at": video_data['updated_at']
            }

        except Exception as e:
            if "Invalid input syntax for type uuid" in str(e):
                raise ValueError("Invalid ID format")
            raise e

    @staticmethod
    async def edit_video(video_id: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Edit a video based on the provided options."""
        try:
            print(f"Starting video editing process for video {video_id}...")
            
            # Initialize services
            script_service = ScriptService()
            segment_service = SegmentService()
            image_handler = ImageService()
            media_service = MediaService()
            
            # Get existing video data
            result = supabase.table('videos').select('*').eq('id', video_id).execute()
            if not result.data:
                raise ValueError(f"Video with ID {video_id} not found")
            
            video_data = result.data[0]
            
            # Get existing segments
            existing_segments = await media_service.get_video_segments(video_id)
            
            # Process segments based on options
            updated_segments = []
            
            segments = options.get('segments', existing_segments)
            
            for segment in segments:
                segment_id = segment.get('id')
                
                if segment.get('deleted'):
                    if segment_id:
                        # Delete segment if it exists
                        await media_service.delete_segment(segment_id)
                    continue
                
                # Prepare segment data
                segment_data = {
                    'video_id': video_id,
                    'speech': segment['speech'],
                    'duration': segment['duration'],
                    'media_urls': segment.get('mediaUrls', [])
                }
                
                if segment_id:
                    # Convert segment_id to integer for update
                    segment_id = int(segment_id)
                    # Update existing segment
                    updated_segment = await media_service.update_segment(segment_id, segment_data)
                else:
                    # Create new segment
                    updated_segment = await media_service.create_segment(video_id, segment_data)
                
                if updated_segment:
                    updated_segments.append(updated_segment)
            
            # Update video record with metadata
            update_data = {
                "updated_at": datetime.now().isoformat()
            }
            
            # Update in database
            result = supabase.table('videos').update(update_data).eq('id', video_id).execute()
            if not result.data:
                raise ValueError("Failed to update video record")
            
            # Prepare response
            response_data = {
                "status": "success",
                "video_id": video_id,
                "segments": updated_segments
            }
            
            return response_data
            
        except Exception as e:
            print(f"Error in video editing: {str(e)}")
            raise

    async def delete_video(self, id: str) -> Dict[str, str]:
        """Delete a video file and its associated segments."""
        try:
            # First, delete all segments associated with this video
            segments_result = supabase.table('segments').delete().eq('video_id', id).execute()
            
            # Then delete the video record
            result = supabase.table('videos').delete().eq('id', id).execute()
            
            if not result.data:
                raise ValueError("Video not found")
                
            return {"message": "Video deleted successfully"}

        except Exception as e:
            raise ValueError(f"Failed to delete video: {str(e)}")

    async def upload_resource(self, file_content: bytes, filename: str) -> Dict[str, str]:
        """Upload a resource file."""
        try:
            # This would integrate with your file storage service
            # For now, returning mock response
            return {
                "file_url": f"/uploads/{filename}",
                "message": "Resource uploaded successfully"
            }
        except Exception as e:
            raise ValueError(f"Failed to upload resource: {str(e)}")

    def create_segmented_video(self, segments: List[Dict], output_dir: str, aspect_ratio: str = "16:9", add_subtitles: bool = True) -> str:
        """Create a video from segments with images and audio."""
        try:
            from moviepy.editor import VideoFileClip, ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip
            
            # Set dimensions based on aspect ratio
            if aspect_ratio == "16:9":
                width, height = 1920, 1080
            elif aspect_ratio == "9:16":
                width, height = 1080, 1920
            elif aspect_ratio == "1:1":
                width, height = 1080, 1080
            else:
                width, height = 1920, 1080  # Default to 16:9
            
            # Calculate target total duration
            target_duration = sum(float(s.get('duration', 10)) for s in segments)
            print(f"Target total duration: {target_duration:.2f}s")
            
            # Process each segment
            video_clips = []
            processed_segments = []  # Store segments with timing info for subtitles
            current_time = 0
            total_duration = 0
            
            print("\nProcessing segments for video creation:")
            for i, segment in enumerate(segments, 1):
                print(f"\nSegment {i}:")
                # Create image clip
                if segment.get('image'):
                    image_clip = ImageClip(segment['image'])
                    # Resize and center the image
                    image_clip = image_clip.resize(height=height)
                    if image_clip.w > width:
                        image_clip = image_clip.crop(x1=(image_clip.w - width)/2, x2=(image_clip.w + width)/2)
                else:
                    # Create a black background if no image
                    image_clip = ColorClip(size=(width, height), color=(0, 0, 0))
                
                # Load audio and get its duration
                audio_clip = AudioFileClip(segment['audio'])
                segment_duration = audio_clip.duration
                print(f"Audio duration: {segment_duration:.2f}s")
                
                # Set duration of image clip to match audio
                image_clip = image_clip.set_duration(segment_duration)
                
                # Combine image and audio
                video_clip = image_clip.set_audio(audio_clip)
                
                # Add crossfade if not the first clip
                if video_clips and i > 1:
                    video_clip = video_clip.crossfadein(0.5)
                
                video_clips.append(video_clip)
                total_duration += segment_duration
                
                # Store segment info for subtitles
                if segment.get('segment') or segment.get('text'):
                    subtitle_text = segment.get('segment') or segment.get('text')
                    processed_segments.append({
                        'text': subtitle_text,
                        'start': current_time,
                        'end': current_time + segment_duration
                    })
                    print(f"Subtitle timing: {current_time:.2f}s -> {current_time + segment_duration:.2f}s")
                
                current_time += segment_duration
            
            print(f"\nTotal duration before concatenation: {total_duration:.2f}s")
            
            # Concatenate all clips
            final_clip = concatenate_videoclips(video_clips, method="compose")
            print(f"Final clip duration: {final_clip.duration:.2f}s")
            
            # Adjust final clip duration if needed
            if abs(final_clip.duration - target_duration) > 0.1:
                print(f"Adjusting final duration from {final_clip.duration:.2f}s to {target_duration:.2f}s")
                final_clip = final_clip.set_duration(target_duration)
            
            # Generate output filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(output_dir, f"video_{timestamp}.mp4")
            
            # Write the final video
            final_clip.write_videofile(
                output_file,
                fps=30,
                codec='libx264',
                audio_codec='aac',
                threads=4,
                preset='medium'
            )
            
            # Clean up clips
            final_clip.close()
            for clip in video_clips:
                clip.close()
            
            # Add subtitles if requested
            if add_subtitles and processed_segments:
                try:
                    from app.services.subtitles_service import SubtitlesService
                    subtitles_service = SubtitlesService()
                    print(f"Applying subtitles to video: {output_file}")
                    print(f"Segments for subtitles: {processed_segments}")
                    output_file = subtitles_service.apply_subtitles_to_video(output_file, processed_segments)
                except Exception as e:
                    print(f"Error applying subtitles: {str(e)}")
                    # Continue without subtitles rather than failing
                    pass
            
            # Verify final duration
            final_video = VideoFileClip(output_file)
            final_duration = final_video.duration
            final_video.close()
            print(f"\nFinal video duration: {final_duration:.2f}s (target: {target_duration:.2f}s)")
            
            if abs(final_duration - target_duration) > 0.5:
                print("Warning: Final duration differs significantly from target")
            
            return output_file
            
        except Exception as e:
            raise ValueError(f"Error creating video: {str(e)}")

    @staticmethod
    def convert_to_audio(text: str, target_duration: Optional[float] = None) -> str:
        """Convert text to audio using ElevenLabs API and adjust duration if specified"""
        try:
            # Generate initial audio
            audio_path = TextToSpeechService.generate_audio(text)
            
            # If target duration is specified, adjust the audio duration
            if target_duration is not None:
                print(f"Adjusting audio duration to {target_duration} seconds")
                adjusted_path = VideoService.adjust_audio_duration(audio_path, target_duration)
                if adjusted_path != audio_path:
                    os.remove(audio_path)  # Clean up original file
                    audio_path = adjusted_path
            
            return audio_path
        except Exception as e:
            print(f"Error in convert_to_audio: {str(e)}")
            raise

    @staticmethod
    def adjust_audio_duration(audio_path: str, target_duration: float, max_attempts: int = 3) -> str:
        """Adjust audio file duration to match target duration exactly"""
        import soundfile as sf
        import numpy as np
        from scipy import signal
        
        # Read the audio file
        data, samplerate = sf.read(audio_path)
        current_duration = len(data) / samplerate
        
        print(f"Current duration: {current_duration:.2f}s, Target: {target_duration:.2f}s")
        
        # If current duration is within 0.1s of target, return original
        if abs(current_duration - target_duration) <= 0.1:
            return audio_path
            
        # Calculate stretch factor
        stretch_factor = target_duration / current_duration
        
        # Ensure stretch factor is reasonable
        if stretch_factor < 0.5 or stretch_factor > 2.0:
            print(f"Warning: Extreme stretch factor {stretch_factor:.2f}")
            # Limit stretch factor to reasonable range
            stretch_factor = max(0.5, min(2.0, stretch_factor))
        
        # Create output path
        output_path = audio_path.replace('.mp3', f'_adjusted.mp3')
        
        # Resample audio
        num_samples = int(len(data) * stretch_factor)
        resampled = signal.resample(data, num_samples)
        
        # Write adjusted audio
        sf.write(output_path, resampled, samplerate)
        
        # Verify final duration
        final_data, _ = sf.read(output_path)
        final_duration = len(final_data) / samplerate
        print(f"Final duration: {final_duration:.2f}s")
        
        if abs(final_duration - target_duration) > 0.1:
            print(f"Warning: Final duration {final_duration:.2f}s differs from target {target_duration:.2f}s")
        
        return output_path

    @staticmethod
    def create_segment_video(text: str, image_path: str, duration: float, output_path: str) -> None:
        """Create a video segment with exact duration"""
        try:
            # Convert text to audio with exact duration
            audio_path = VideoService.convert_to_audio(text, target_duration=duration)
            
            # Create video command
            cmd = [
                'ffmpeg', '-y',
                '-loop', '1',
                '-i', image_path,
                '-i', audio_path,
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                '-t', str(duration),
                output_path
            ]
            
            # Execute command
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error creating segment: {result.stderr}")
                raise Exception(f"Failed to create video segment: {result.stderr}")
            
            # Clean up audio file
            os.remove(audio_path)
            
        except Exception as e:
            print(f"Error in create_segment_video: {str(e)}")
            raise 