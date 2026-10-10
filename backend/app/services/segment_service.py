from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from app.db.config.supabase import supabase
from app.core.config import settings
import os
from pathlib import Path

class SegmentService:
    def __init__(self):
        from app.services.transformer_service import TransformerService
        self.transformer_service = TransformerService()

    async def get_video_segments(self, video_id: str) -> List[dict]:
        """Get all segments for a specific video."""
        try:
            result = supabase.table('segments').select('*').eq('video_id', video_id).order('sequence_id').execute()
            segments = result.data or []
            
            # Process segments to match VideoSegment model
            processed_segments = []
            for segment in segments:
                processed_segment = {
                    'id': segment['id'],
                    'speech': segment.get('speech', ''),
                    'duration': float(segment.get('duration', 0)),
                    'mediaPrompt': segment.get('media_prompt', None),
                    'mediaUrls': segment.get('media_urls', []),
                    'url': segment.get('url', None),
                    'sequenceId': segment.get('sequence_id', 0)  # Ensure we use 0 as default if not set
                }
                processed_segments.append(processed_segment)
            
            return processed_segments
        except Exception as e:
            print(f"Error fetching segments: {str(e)}")
            return []

    async def create_segment(self, video_id: str, segment_data: dict) -> dict:
        """Create a new segment."""
        try:
            # Get max sequence_id for this video
            result = supabase.table('segments').select('sequence_id').eq('video_id', video_id).order('sequence_id.desc').limit(1).execute()
            max_sequence = result.data[0]['sequence_id'] if result.data else 0
            
            # Add timestamps, video_id and sequence_id
            segment_data.update({
                'video_id': video_id,
                'sequence_id': segment_data.get('sequence_id', max_sequence + 1),  # Use provided sequence_id or increment
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
            
            # Create video segment if media_urls are provided
            if segment_data.get('media_urls') and len(segment_data['media_urls']) > 0:
                # Create output directories
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_dir = os.path.join(settings.VIDEOS_DIR, timestamp, "segments")
                os.makedirs(output_dir, exist_ok=True)
                
                # Download the first image
                from app.services.image_service import ImageService
                image_handler = ImageService()
                image_path = image_handler.download_image(segment_data['media_urls'][0], Path(output_dir))
                
                if image_path:
                    try:
                        # Create video segment
                        segment_path = await self.create_video_segment(
                            text=segment_data['speech'],
                            image_path=str(image_path),
                            duration=segment_data['duration'],
                            output_dir=output_dir,
                            add_subtitles=True
                        )
                        
                        if segment_path and os.path.exists(segment_path):
                            # Get relative path for segment URL
                            static_dir = Path(settings.STATIC_DIR)
                            try:
                                relative_path = Path(segment_path).relative_to(static_dir)
                                segment_data['url'] = f"/static/{relative_path}"
                            except ValueError:
                                segment_data['url'] = f"/static/videos/{timestamp}/segments/{os.path.basename(segment_path)}"
                    except Exception as e:
                        print(f"Error creating video segment: {str(e)}")
            
            result = supabase.table('segments').insert(segment_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating segment: {str(e)}")
            return None

    async def update_segment(self, segment_id: int, segment_data: dict) -> dict:
        """Update an existing segment."""
        try:
            # Update timestamp
            segment_data['updated_at'] = datetime.now().isoformat()
            
            result = supabase.table('segments').update(segment_data).eq('id', segment_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error updating segment: {str(e)}")
            return None

    async def delete_segment(self, segment_id: str) -> bool:
        """Delete a segment."""
        try:
            result = supabase.table('segments').delete().eq('id', segment_id).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting segment: {str(e)}")
            return False

    def process_video_segments(self, video_item: dict) -> dict:
        """Process video segments to ensure proper format and data."""
        if 'segments' not in video_item or video_item['segments'] is None:
            video_item['segments'] = []
        else:
            total_segments = len(video_item['segments'])
            if total_segments > 0:
                total_duration = video_item['duration']
                default_segment_duration = total_duration // total_segments if total_duration > 0 else 10
                
                processed_segments = []
                for i, segment in enumerate(video_item['segments'], 1):
                    processed_segment = {
                        'speech': segment.get('speech', ''),
                        'duration': segment.get('duration', default_segment_duration),
                        'media_prompt': segment.get('mediaPrompt'),
                        'media_urls': segment.get('mediaUrls', []),
                        'url': segment.get('url'),
                        'sequence_id': segment.get('sequenceId', i)  # Use index+1 as default sequence_id
                    }
                    processed_segments.append(processed_segment)
                video_item['segments'] = processed_segments
        return video_item

    async def create_video_segment(self, text: str, image_path: str, duration: float, output_dir: str, add_subtitles: bool = True) -> str:
        """Create a complete video segment with image, audio, and subtitles."""
        try:
            import os
            from datetime import datetime
            import subprocess
            from PIL import Image

            # Step 0: Ensure image dimensions are compatible with video encoder
            with Image.open(image_path) as img:
                # Get original dimensions
                width, height = img.size
                # Make dimensions divisible by 2
                new_width = width - (width % 2)
                new_height = height - (height % 2)
                # Resize if necessary
                if width != new_width or height != new_height:
                    img = img.resize((new_width, new_height))
                    # Save resized image with a new name
                    resized_image_path = os.path.splitext(image_path)[0] + "_resized.jpg"
                    img.save(resized_image_path)
                    image_path = resized_image_path

            # Generate unique filename for this segment
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            segment_path = os.path.join(output_dir, f"segment_{timestamp}.mp4")
            
            # Step 1: Generate and adjust audio
            audio_path = await self.transformer_service.convert_to_audio(
                text=text,
                output_dir=output_dir,
                target_duration=duration
            )
            
            # Step 2: Create video with image and audio
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
                segment_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Failed to create video segment: {result.stderr}")
            
            # Step 3: Add subtitles if requested
            if add_subtitles:
                try:
                    from app.services.subtitles_service import SubtitlesService
                    subtitles_service = SubtitlesService()
                    
                    # Create subtitle segment with exact timing
                    subtitle_segment = [{
                        'text': text,
                        'start': 0,
                        'end': duration
                    }]
                    
                    segment_path = subtitles_service.apply_subtitles_to_video(segment_path, subtitle_segment)
                except Exception as e:
                    print(f"Error applying subtitles to segment: {str(e)}")
            
            # Clean up temporary files
            os.remove(audio_path)
            if image_path.endswith("_resized.jpg"):
                os.remove(image_path)
            
            return segment_path
            
        except Exception as e:
            print(f"Error creating video segment: {str(e)}")
            raise

    async def concatenate_segments(self, segment_paths: List[str], output_dir: str, add_crossfade: bool = True) -> str:
        """Concatenate video segments with optional crossfade effect."""
        try:
            import os
            from datetime import datetime
            from moviepy.editor import VideoFileClip, concatenate_videoclips
            
            if not segment_paths:
                raise ValueError("No segment paths provided")
            
            print(f"Concatenating segments: {segment_paths}")
            
            # Load all video clips
            video_clips = []
            for path in segment_paths:
                try:
                    print(f"Loading clip: {path}")
                    clip = VideoFileClip(path)
                    if add_crossfade and video_clips:  # Add crossfade if not the first clip
                        clip = clip.crossfadein(0.5)
                    video_clips.append(clip)
                except Exception as e:
                    print(f"Error loading clip {path}: {str(e)}")
                    raise ValueError(f"Failed to load video clip: {path}")
            
            if not video_clips:
                raise ValueError("No valid video clips loaded")
            
            print(f"Loaded {len(video_clips)} clips successfully")
            
            # Concatenate clips
            try:
                final_clip = concatenate_videoclips(video_clips, method="compose")
            except Exception as e:
                print(f"Error concatenating clips: {str(e)}")
                raise ValueError("Failed to concatenate video clips")
            
            # Generate output path
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(output_dir, f"final_{timestamp}.mp4")
            
            print(f"Writing final video to: {output_path}")
            
            # Write final video
            try:
                final_clip.write_videofile(
                    output_path,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    threads=4,
                    preset='medium'
                )
            except Exception as e:
                print(f"Error writing video file: {str(e)}")
                raise ValueError("Failed to write final video file")
            
            # Clean up
            try:
                final_clip.close()
                for clip in video_clips:
                    clip.close()
            except Exception as e:
                print(f"Error cleaning up clips: {str(e)}")
            
            if not os.path.exists(output_path):
                raise ValueError("Output file was not created successfully")
            
            return output_path
            
        except Exception as e:
            print(f"Error concatenating segments: {str(e)}")
            raise

    def segment_script(self, script: str, target_duration: int) -> List[Dict[str, Any]]:
        """Segment a script into logical parts with timing."""
        try:
            # Split script into sentences
            sentences = re.split(r'(?<=[.!?])\s+', script)
            
            # Remove empty sentences
            sentences = [s.strip() for s in sentences if s.strip()]
            
            # Calculate approximate duration per sentence
            total_sentences = len(sentences)
            duration_per_segment = target_duration // total_sentences if total_sentences > 0 else target_duration
            
            # Create segments
            segments = []
            for sentence in sentences:
                segment = {
                    'text': sentence,
                    'duration': duration_per_segment,
                }
                segments.append(segment)
            
            return segments
            
        except Exception as e:
            raise ValueError(f"Error segmenting script: {str(e)}")

    async def regenerate_segment(self, video_id: str, segment_id: int, speech: str = None, media_prompt: str = None, media_urls: List[str] = None) -> dict:
        """Regenerate a segment with new content.
        
        If speech is provided: Regenerates audio and subtitles with same image
        If media_prompt/media_urls are provided: Regenerates video with new image but same audio
        """
        try:
            # Get existing segment
            result = supabase.table('segments').select('*').eq('id', segment_id).execute()
            if not result.data:
                raise ValueError("Segment not found")
            
            existing_segment = result.data[0]
            
            # Create output directories
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_dir = os.path.join(settings.VIDEOS_DIR, timestamp, "segments")
            os.makedirs(output_dir, exist_ok=True)
            
            # Update segment data while preserving sequence_id
            segment_data = {
                'updated_at': datetime.now().isoformat(),
                'sequence_id': existing_segment['sequence_id']  # Preserve existing sequence_id
            }
            
            # Case 1: Speech update - regenerate audio and subtitles
            if speech is not None:
                segment_data['speech'] = speech
                
                # Get existing image
                image_path = None
                if existing_segment['media_urls'] and len(existing_segment['media_urls']) > 0:
                    from app.services.image_service import ImageService
                    image_handler = ImageService()
                    image_path = image_handler.download_image(existing_segment['media_urls'][0], Path(output_dir))
                
                if not image_path:
                    raise ValueError("Failed to get existing image for segment")
                
                # Create new video segment with new speech but same image
                segment_path = await self.create_video_segment(
                    text=speech,
                    image_path=str(image_path),
                    duration=existing_segment['duration'],
                    output_dir=output_dir,
                    add_subtitles=True
                )
                
                if segment_path and os.path.exists(segment_path):
                    # Update URL
                    static_dir = Path(settings.STATIC_DIR)
                    try:
                        relative_path = Path(segment_path).relative_to(static_dir)
                        segment_data['url'] = f"/static/{relative_path}"
                    except ValueError:
                        segment_data['url'] = f"/static/videos/{timestamp}/segments/{os.path.basename(segment_path)}"
            
            # Case 2: Media update - regenerate video with new image but same audio/speech
            elif media_prompt is not None or media_urls is not None:
                if media_prompt is not None:
                    segment_data['media_prompt'] = media_prompt
                if media_urls is not None:
                    segment_data['media_urls'] = media_urls
                
                # Get image path
                image_path = None
                if media_urls and len(media_urls) > 0:
                    from app.services.image_service import ImageService
                    image_handler = ImageService()
                    image_path = image_handler.download_image(media_urls[0], Path(output_dir))
                
                if not image_path:
                    raise ValueError("Failed to get new image for segment")
                
                # Create new video segment with new image but same speech
                segment_path = await self.create_video_segment(
                    text=existing_segment['speech'],
                    image_path=str(image_path),
                    duration=existing_segment['duration'],
                    output_dir=output_dir,
                    add_subtitles=True
                )
                
                if segment_path and os.path.exists(segment_path):
                    # Update URL
                    static_dir = Path(settings.STATIC_DIR)
                    try:
                        relative_path = Path(segment_path).relative_to(static_dir)
                        segment_data['url'] = f"/static/{relative_path}"
                    except ValueError:
                        segment_data['url'] = f"/static/videos/{timestamp}/segments/{os.path.basename(segment_path)}"
            
            # Update segment in database
            result = supabase.table('segments').update(segment_data).eq('id', segment_id).execute()
            if not result.data:
                raise ValueError("Failed to update segment")
            
            updated_segment = result.data[0]
            
            # Return processed segment
            return {
                'id': updated_segment['id'],
                'speech': updated_segment['speech'],
                'duration': float(updated_segment['duration']),
                'mediaPrompt': updated_segment.get('media_prompt'),
                'mediaUrls': updated_segment.get('media_urls', []),
                'url': updated_segment.get('url'),
                'sequenceId': updated_segment.get('sequence_id', 0)  # Include sequenceId in response
            }
            
        except Exception as e:
            print(f"Error regenerating segment: {str(e)}")
            raise

    async def update_segment_sequence(self, video_id: str, segment_sequences: List[Dict[str, int]]) -> bool:
        """Update sequence IDs for multiple segments."""
        try:
            for sequence in segment_sequences:
                segment_id = sequence['id']
                new_sequence_id = sequence['sequenceId']
                
                result = supabase.table('segments').update({
                    'sequence_id': new_sequence_id,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', segment_id).eq('video_id', video_id).execute()
                
                if not result.data:
                    raise ValueError(f"Failed to update sequence for segment {segment_id}")
            
            return True
        except Exception as e:
            print(f"Error updating segment sequences: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return False 