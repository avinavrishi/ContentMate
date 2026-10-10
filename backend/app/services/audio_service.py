from typing import Dict, Optional, List
from datetime import datetime
import re
from pathlib import Path
from app.db.config.supabase import supabase
from app.services.script_service import ScriptService
from app.services.transformer_service import TransformerService

class AudioService:
    def __init__(self):
        self.script_service = ScriptService()
        self.transformer_service = TransformerService()

    def generate_title_from_content(self, prompt: str, script: str) -> str:
        """Generate a meaningful title from the prompt and script."""
        # Try to use the first sentence of the script
        first_sentence = script.split('.')[0].strip()
        if len(first_sentence.split()) <= 8:
            return first_sentence.title()
        
        # If first sentence is too long, use the prompt
        clean_prompt = re.sub(r'[^\w\s]', ' ', prompt)
        words = clean_prompt.split()
        title_words = words[:min(8, len(words))]
        return ' '.join(title_words).title()

    async def create_audio(self, request: Dict) -> Dict:
        """Create an audio file from the request parameters."""
        try:
            # Generate script if not provided
            script = request.get('script')
            if not script and request.get('prompt'):
                # Use content generator to create script from prompt
                content = await self.script_service.generate_script(request['prompt'])
                script = content.get('script', '')

            if not script:
                raise ValueError("No script provided or generated")

            # Generate audio from script
            audio_options = {
                'language': request.get('language', 'English'),
                'dialect': request.get('dialect', 'US'),
            }

            if request.get('customizations'):
                audio_options.update({
                    'speed': request['customizations'].get('speed', 1.0),
                    'pitch': request['customizations'].get('pitch', 1.0),
                    'volume': request['customizations'].get('volume', 1.0),
                })

            # Convert text to speech
            audio_path = await self.transformer_service.convert_to_speech(script, audio_options)

            # Generate title
            title = self.generate_title_from_content(request.get('prompt', ''), script)

            # Calculate file size
            file_size = Path(audio_path).stat().st_size
            file_size_mb = f"{file_size / (1024 * 1024):.1f} MB"

            # Prepare metadata for database
            audio_data = {
                "title": title,
                "duration": str(request.get('duration', 0)),
                "file_size": file_size_mb,
                "type": "generated",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            # Save to database
            result = supabase.table('audio').insert(audio_data).execute()
            if hasattr(result, 'error') and result.error:
                raise ValueError(f"Database error: {result.error}")

            return {
                "status": "success",
                "audio_path": str(audio_path),
                "script": script
            }

        except Exception as e:
            raise ValueError(f"Failed to create audio: {str(e)}")

    async def get_audio(self, id: str) -> Dict:
        """Get a specific audio by ID."""
        try:
            result = supabase.table('audio').select('*').eq('id', id).execute()
            
            if not result.data or len(result.data) == 0:
                raise ValueError("Audio not found")
            
            audio_data = result.data[0]
            
            # Convert duration to integer
            if 'duration' in audio_data:
                try:
                    duration_str = str(audio_data['duration']).rstrip('s')
                    audio_data['duration'] = int(float(duration_str))
                except (ValueError, TypeError):
                    audio_data['duration'] = 0
            
            return audio_data

        except Exception as e:
            if "Invalid input syntax for type uuid" in str(e):
                raise ValueError("Invalid ID format")
            raise e

    async def update_audio(self, id: str, update_data: Dict) -> Dict:
        """Update an audio file's metadata."""
        try:
            # Get current audio data
            result = supabase.table('audio').select('*').eq('id', id).execute()
            if not result.data:
                raise ValueError("Audio not found")
            
            # Update the timestamp
            update_data['updated_at'] = datetime.now().isoformat()
            
            # Update in database
            result = supabase.table('audio').update(update_data).eq('id', id).execute()
            
            if not result.data:
                raise ValueError("Failed to update audio")
            
            audio_data = result.data[0]
            
            # Convert duration to integer
            if 'duration' in audio_data:
                try:
                    duration_str = str(audio_data['duration']).rstrip('s')
                    audio_data['duration'] = int(float(duration_str))
                except (ValueError, TypeError):
                    audio_data['duration'] = 0
            
            return audio_data

        except Exception as e:
            raise ValueError(f"Failed to update audio: {str(e)}")

    async def delete_audio(self, id: str) -> Dict[str, str]:
        """Delete an audio file."""
        try:
            result = supabase.table('audio').delete().eq('id', id).execute()
            
            if not result.data:
                raise ValueError("Audio not found")
                
            return {"message": "Audio deleted successfully"}

        except Exception as e:
            raise ValueError(f"Failed to delete audio: {str(e)}") 