import os
import wave
import json
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from vosk import Model, KaldiRecognizer
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from app.core.config import get_settings

settings = get_settings()

class SubtitlesService:
    def __init__(self):
        model_path = os.path.join(settings.APP_DIR, "models", "vosk-model-en-us-0.22")
        if not os.path.exists(model_path):
            raise RuntimeError(f"Please download the model from https://alphacephei.com/vosk/models and unpack to {model_path}")
        self.model = Model(model_path)

    def convert_to_wav(self, audio_path: str | Path, output_path: str | Path = None) -> str:
        """Convert audio file to WAV format with correct parameters for Vosk."""
        audio_path = str(audio_path)
        if output_path is None:
            output_path = os.path.splitext(audio_path)[0] + "_converted.wav"
        else:
            output_path = str(output_path)
        
        # Read audio file using soundfile
        data, samplerate = sf.read(audio_path)
        
        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        
        # Resample to 16kHz if needed
        if samplerate != 16000:
            from scipy import signal
            # Calculate number of samples for 16kHz
            n_samples = int(len(data) * 16000 / samplerate)
            data = signal.resample(data, n_samples)
        
        # Save as WAV
        sf.write(output_path, data, 16000, subtype='PCM_16')
        return output_path

    def generate_subtitles(self, audio_path: str | Path, output_path: str | Path = None) -> Tuple[str, List[Dict]]:
        """Generate subtitles from audio file."""
        audio_path = str(audio_path)
        if output_path is None:
            output_path = os.path.splitext(audio_path)[0] + ".srt"
        else:
            output_path = str(output_path)

        # Convert audio to WAV format if needed
        if not audio_path.lower().endswith('.wav'):
            wav_path = self.convert_to_wav(audio_path)
        else:
            wav_path = audio_path

        try:
            wf = wave.open(wav_path, "rb")
            rec = KaldiRecognizer(self.model, wf.getframerate())
            rec.SetWords(True)

            # Process audio file
            words = []
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    result = json.loads(rec.Result())
                    if result.get('result'):
                        words.extend(result['result'])

            # Get final words
            final_result = json.loads(rec.FinalResult())
            if final_result.get('result'):
                words.extend(final_result['result'])

            # Group words into phrases with proper timing
            subtitles = []
            current_phrase = []
            current_start = None
            max_duration = 3.0  # Maximum duration for a subtitle in seconds

            for word in words:
                if not current_start:
                    current_start = word['start']
                current_phrase.append(word['word'])

                # Create a new subtitle if:
                # 1. Current phrase duration exceeds max_duration, or
                # 2. We have a natural pause (>0.3s), or
                # 3. We have enough words (>10)
                if (word['end'] - current_start > max_duration or
                    (len(words) > words.index(word) + 1 and 
                     words[words.index(word) + 1]['start'] - word['end'] > 0.3) or
                    len(current_phrase) >= 10):
                    
                    subtitles.append({
                        'start': current_start,
                        'end': word['end'],
                        'text': ' '.join(current_phrase)
                    })
                    current_phrase = []
                    current_start = None

            # Add any remaining words
            if current_phrase:
                subtitles.append({
                    'start': current_start,
                    'end': words[-1]['end'],
                    'text': ' '.join(current_phrase)
                })

            # Write subtitles to SRT file
            with open(output_path, 'w', encoding='utf-8') as f:
                for i, sub in enumerate(subtitles, 1):
                    start_str = self.format_time(sub['start'])
                    end_str = self.format_time(sub['end'])
                    
                    f.write(f"{i}\n")
                    f.write(f"{start_str} --> {end_str}\n")
                    f.write(f"{sub['text']}\n\n")

            return output_path, subtitles

        finally:
            # Clean up temporary WAV file if we created one
            if audio_path != wav_path:
                try:
                    os.remove(wav_path)
                except:
                    pass

    def format_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format (HH:MM:SS,mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        seconds = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{int(seconds):02d},{int((seconds % 1) * 1000):03d}"

    def apply_subtitles_to_video(self, video_path: str | Path, subtitles: List[Dict], output_path: str | Path = None) -> str:
        """Apply subtitles to a video file."""
        try:
            video_path = str(video_path)
            if output_path is None:
                output_path = os.path.splitext(video_path)[0] + "_with_subtitles" + os.path.splitext(video_path)[1]
            else:
                output_path = str(output_path)
            
            print(f"Applying subtitles to video: {video_path}")
            
            # Load the video
            video = VideoFileClip(video_path)
            
            # Create text clips for each subtitle
            text_clips = []
            for sub in subtitles:
                text_clip = (TextClip(sub['text'], 
                                    fontsize=48, 
                                    color='white',
                                    font='Arial',
                                    size=(video.w * 0.9, None),  # 90% of video width
                                    method='caption',
                                    stroke_color='black',
                                    stroke_width=2)
                            .set_position(('center', 0.85), relative=True)  # Position at 85% from top
                            .set_start(sub['start'])
                            .set_duration(sub['end'] - sub['start'])
                            .crossfadein(0.1)  # Smooth fade in
                            .crossfadeout(0.1))  # Smooth fade out
                text_clips.append(text_clip)
            
            # Add subtitles to video
            final_video = CompositeVideoClip([video] + text_clips)
            
            # Write the final video
            print(f"Writing video with subtitles to: {output_path}")
            final_video.write_videofile(
                output_path,
                fps=video.fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile="temp-audio.m4a",
                remove_temp=True
            )
            
            # Clean up
            video.close()
            final_video.close()
            for clip in text_clips:
                clip.close()
            
            print("Subtitles applied successfully")
            return output_path
            
        except Exception as e:
            print(f"Error applying subtitles: {str(e)}")
            raise 