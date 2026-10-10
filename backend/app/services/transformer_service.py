from typing import Optional, Dict, Any
from gtts import gTTS
from pathlib import Path
import os
from datetime import datetime
from moviepy.editor import AudioFileClip
import numpy as np
import soundfile as sf
from scipy import signal

class TransformerService:
    def __init__(self):
        pass

    def adjust_audio_duration(self, audio_path: str, target_duration: float) -> str:
        """Adjust audio file duration to match target duration exactly."""
        try:
            # Load the audio file
            data, samplerate = sf.read(audio_path)
            current_duration = len(data) / samplerate
            
            if abs(current_duration - target_duration) < 0.05:  # Tighter tolerance (0.05s)
                return audio_path
            
            print(f"Adjusting audio duration from {current_duration:.2f}s to {target_duration:.2f}s")
            
            # Calculate the stretch factor
            stretch_factor = target_duration / current_duration
            
            # Convert to mono if stereo
            if len(data.shape) > 1:
                data = np.mean(data, axis=1)
            
            # Calculate new length
            new_length = int(len(data) * stretch_factor)
            
            # Use high-quality resampling
            resampled_data = signal.resample(data, new_length)
            
            # Generate output path
            output_path = os.path.splitext(audio_path)[0] + "_adjusted.wav"
            
            # Save the adjusted audio with high quality
            sf.write(output_path, resampled_data, samplerate)
            
            # Convert to MP3 using ffmpeg for compatibility
            mp3_path = output_path.replace('.wav', '.mp3')
            os.system(f'ffmpeg -y -i "{output_path}" -acodec libmp3lame -q:a 2 "{mp3_path}"')
            
            # Clean up WAV file
            os.remove(output_path)
            
            # Verify final duration
            final_audio = AudioFileClip(mp3_path)
            final_duration = final_audio.duration
            final_audio.close()
            
            print(f"Final audio duration: {final_duration:.3f}s (target: {target_duration:.3f}s)")
            
            # If duration is still off by more than 0.05s, try one more time
            if abs(final_duration - target_duration) > 0.05:
                print("Duration still off, performing second adjustment...")
                data, samplerate = sf.read(mp3_path)
                new_stretch = target_duration / final_duration
                new_length = int(len(data) * new_stretch)
                resampled_data = signal.resample(data, new_length)
                
                # Save again
                output_path = os.path.splitext(mp3_path)[0] + "_final.wav"
                sf.write(output_path, resampled_data, samplerate)
                
                # Convert to MP3
                final_mp3_path = output_path.replace('.wav', '.mp3')
                os.system(f'ffmpeg -y -i "{output_path}" -acodec libmp3lame -q:a 2 "{final_mp3_path}"')
                
                # Clean up intermediate files
                os.remove(output_path)
                os.remove(mp3_path)
                mp3_path = final_mp3_path
            
            # Clean up original file if different
            if mp3_path != audio_path:
                os.remove(audio_path)
            
            return mp3_path
            
        except Exception as e:
            print(f"Error adjusting audio duration: {str(e)}")
            return audio_path

    async def convert_to_speech(self, text: str, output_dir: str, language: str = "English", dialect: str = "US") -> str:
        """Convert text to speech using gTTS."""
        try:
            # Map language and dialect to gTTS format (e.g., "English-US" -> "en")
            lang_code = "en"  # Default to English
            if language.lower() == "english":
                lang_code = "en"
            elif language.lower() == "spanish":
                lang_code = "es"
            # Add more language mappings as needed
            
            # Initialize gTTS
            tts = gTTS(text=text, lang=lang_code, slow=False)
            
            # Generate output filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(output_dir, f"speech_{timestamp}.mp3")
            
            # Save the audio file
            tts.save(output_file)
            
            return output_file
            
        except Exception as e:
            raise ValueError(f"Error in text-to-speech conversion: {str(e)}")

    async def convert_to_audio(self, text: str, output_dir: str, target_duration: Optional[float] = None, language: str = "English", dialect: str = "US") -> str:
        """Convert text to audio with exact duration target."""
        try:
            # Generate initial audio
            audio_file = await self.convert_to_speech(text, output_dir, language, dialect)
            
            # If target duration is specified, adjust the audio duration
            if target_duration is not None:
                audio_file = self.adjust_audio_duration(audio_file, target_duration)
            
            return audio_file
            
        except Exception as e:
            raise ValueError(f"Error in text-to-audio conversion: {str(e)}") 