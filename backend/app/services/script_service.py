import google.generativeai as genai
from app.core.config import settings
from typing import Dict, Any
import json
import re
import time
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure Gemini once at module level
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(settings.GEMINI_MODEL)

class ScriptService:
    @staticmethod
    def _handle_rate_limit(retry_state):
        """Handle rate limit by waiting before retry."""
        wait_time = min(2 ** retry_state.attempt_number, 32)  # Max 32 seconds
        print(f"Rate limit hit, waiting {wait_time} seconds before retry...")
        time.sleep(wait_time)
        return None

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=32),
        retry_error_callback=_handle_rate_limit
    )
    def _generate_content(prompt: str) -> str:
        """Generate content with retry logic for rate limits."""
        try:
            result = model.generate_content(prompt)
            return result.text.strip()
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                print("Rate limit encountered, will retry...")
                raise  # This will trigger retry
            raise ValueError(f"Error generating content: {str(e)}")

    @staticmethod
    def summarize(script: str, max_words: int = 200) -> str:
        """
        Summarize the given script to a specified maximum word count while maintaining key points.
        
        Args:
            script: The script to summarize
            max_words: Maximum number of words in the summary (default: 200)
            
        Returns:
            str: The summarized script
        """
        try:
            summarize_prompt = f"""
            Summarize the following script in {max_words} words or less while maintaining the key points and message:

            {script}

            Rules for summarization:
            1. Keep the main message and key points
            2. Maintain the tone and style
            3. Make it flow naturally
            4. Stay under {max_words} words
            5. Keep it engaging and impactful
            
            Return only the summarized text without any additional comments or formatting.
            """
            
            result = model.generate_content(summarize_prompt)
            return result.text.strip()
            
        except Exception as e:
            raise ValueError(f"Error summarizing script: {str(e)}")
    
    @staticmethod
    def analyze(script: str) -> Dict[str, Any]:
        """
        Analyze the script and suggest tone, purpose, and audience.
        
        Args:
            script: The script to analyze
            
        Returns:
            Dict containing tone, purpose, and audience suggestions
        """
        try:
            analysis_prompt = f"""
            Analyze the following content and suggest appropriate options for:
            - Tone (e.g., humorous, whimsical, energetic, etc.)
            - Purpose (e.g., social media, advertisement, brand awareness, etc.)
            - Target audience (e.g., pet lovers, cyclists, families, etc.)
            
            Content: {script}
            
            Format your response as a JSON object with the following structure:
            {{
                "tone": ["suggested_tone1", "suggested_tone2", "suggested_tone3"],
                "purpose": ["suggested_purpose1", "suggested_purpose2", "suggested_purpose3"],
                "audience": ["suggested_audience1", "suggested_audience2", "suggested_audience3"]
            }}
            
            Make sure each category has exactly 3 relevant suggestions. Only return the JSON object.
            """
            
            result = model.generate_content(analysis_prompt)
            response_text = result.text.strip()
            
            try:
                # Try to parse the response as JSON
                suggestions = json.loads(response_text)
                
                # Validate the response structure
                required_keys = ["tone", "purpose", "audience"]
                if not all(key in suggestions for key in required_keys):
                    raise ValueError("Missing required keys in response")
                
                # Ensure each category has exactly 3 suggestions
                for key in required_keys:
                    if not isinstance(suggestions[key], list) or len(suggestions[key]) != 3:
                        suggestions[key] = suggestions[key][:3] if len(suggestions[key]) > 3 else suggestions[key] + ["General"] * (3 - len(suggestions[key]))
                
                return suggestions
                
            except json.JSONDecodeError:
                # If JSON parsing fails, create a default response
                return {
                    "tone": ["Descriptive", "Simple", "Straightforward"],
                    "purpose": ["Content Creation", "Documentation", "Information Sharing"],
                    "audience": ["General Audience", "Content Viewers", "Online Users"]
                }
            
        except Exception as e:
            # Return a default response in case of any error
            return {
                "tone": ["Descriptive", "Simple", "Straightforward"],
                "purpose": ["Content Creation", "Documentation", "Information Sharing"],
                "audience": ["General Audience", "Content Viewers", "Online Users"]
            } 
    
    @staticmethod
    def generate_script(prompt: str, category: str = "video") -> Dict[str, Any]:
        try:
            # Parse the prompt JSON
            options = json.loads(prompt)
            total_duration = float(options['duration'])
            
            # For a short video (5s), use 2 segments
            # This gives us: 2.25s + 0.5s + 2.25s = 5s total
            optimal_segment_count = 2
            crossfade_duration = 0.5  # seconds per transition
            total_crossfade_time = (optimal_segment_count - 1) * crossfade_duration
            
            # Calculate segment duration accounting for crossfades
            available_duration = total_duration - total_crossfade_time
            base_segment_duration = available_duration / optimal_segment_count
            
            # Create the generation prompt
            generation_prompt = f"""
            You are a professional script writer. Create a {total_duration} second {category} script that is:
            - Tone: {options['tone']}
            - Purpose: {options['purpose']}
            - Target Audience: {options['audience']}
            - Language: {options['language']}
            
            Topic/Prompt: {options['prompt']}
            
            Break the script into EXACTLY {optimal_segment_count} segments where:
            - Each segment should be a single, concise sentence
            - Each segment MUST take EXACTLY {base_segment_duration:.1f} seconds to narrate naturally
            - Keep sentences very short and easy to narrate quickly
            - Use simple words that are easy to pronounce
            
            Return ONLY a valid JSON object with the following structure, and nothing else:
            {{
                "segments": [
                    {{
                        "speech": "segment text here",
                        "duration": {base_segment_duration},
                        "mediaPrompt": "detailed description for background image",
                        "mediaUrls": [],
                        "url": ""
                    }}
                ]
            }}
            
            Additional requirements:
            1. EXACTLY {optimal_segment_count} segments
            2. Each segment MUST be exactly {base_segment_duration:.1f} seconds when spoken
            3. Keep sentences VERY short (max 5-7 words)
            4. Use simple words that are easy to pronounce
            5. Image descriptions should be detailed and specific
            6. Ensure the JSON is properly formatted with double quotes
            
            Note: The final video will have a {crossfade_duration}s crossfade between segments.
            
            Additional context: {options.get('additional_context', '')}
            """
            
            # Generate the script with retry logic
            response_text = ScriptService._generate_content(generation_prompt)
            
            # Clean up the response text to ensure valid JSON
            response_text = re.sub(r'```json\s*|\s*```', '', response_text)
            response_text = response_text.strip()
            
            try:
                content = json.loads(response_text)
                if not content.get('segments'):
                    raise ValueError("No segments in generated content")
                
                # Force exact durations
                segments = content['segments']
                segment_count = len(segments)
                if segment_count != optimal_segment_count:
                    raise ValueError(f"Expected {optimal_segment_count} segments, got {segment_count}")
                
                # Set exact durations for each segment
                for segment in segments:
                    segment['duration'] = base_segment_duration
                    # Estimate word count for validation
                    word_count = len(segment['speech'].split())
                    estimated_duration = (word_count / 150) * 60  # 150 words per minute
                    if abs(estimated_duration - base_segment_duration) > base_segment_duration * 0.3:
                        print(f"Warning: Segment may not fit duration naturally. Words: {word_count}, Est. duration: {estimated_duration:.1f}s")
                
                # Calculate total duration including crossfades
                content_duration = sum(s['duration'] for s in segments)
                final_duration = content_duration + total_crossfade_time
                
                if abs(final_duration - total_duration) > 0.1:
                    raise ValueError(f"Total duration {final_duration:.1f}s does not match target {total_duration:.1f}s")
                
                return content
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error: {str(e)}")
                print(f"Response text: {response_text}")
                raise ValueError("Failed to parse generated content")
                
        except Exception as e:
            print(f"Error generating script: {str(e)}")
            raise 