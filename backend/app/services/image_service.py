from typing import List, Optional
import requests
from pathlib import Path
import os
from datetime import datetime
from app.core.config import settings

class ImageService:
    def __init__(self):
        self.unsplash_api_key = settings.UNSPLASH_API_KEY
        self.unsplash_api_url = "https://api.unsplash.com"

    def search_images(self, query: str, per_page: int = 5) -> List[str]:
        """Search for images using Unsplash API."""
        try:
            if not query:
                return []

            headers = {
                "Authorization": f"Client-ID {self.unsplash_api_key}"
            }
            
            params = {
                "query": query,
                "per_page": per_page,
                "orientation": "landscape"
            }
            
            response = requests.get(
                f"{self.unsplash_api_url}/search/photos",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                print(f"Error from Unsplash API: {response.text}")
                return []
            
            data = response.json()
            return [photo["urls"]["regular"] for photo in data["results"]]
            
        except Exception as e:
            print(f"Error searching images: {str(e)}")
            return []

    def download_image(self, url: str, output_dir: Path) -> Optional[Path]:
        """Download an image from URL."""
        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"Error downloading image: {response.status_code}")
                return None
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{timestamp}.jpg"
            output_path = output_dir / filename
            
            # Save image
            with open(output_path, "wb") as f:
                f.write(response.content)
            
            return output_path
            
        except Exception as e:
            print(f"Error downloading image: {str(e)}")
            return None

    def create_thumbnail(self, video_path: str, output_dir: Path) -> str:
        """Create a thumbnail from a video."""
        try:
            from moviepy.editor import VideoFileClip
            
            # Load video
            video = VideoFileClip(video_path)
            
            # Get frame from middle of video
            frame_time = video.duration / 2
            
            # Generate thumbnail filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            thumbnail_filename = f"thumbnail_{timestamp}.jpg"
            thumbnail_path = output_dir / thumbnail_filename
            
            # Save frame as thumbnail
            video.save_frame(str(thumbnail_path), t=frame_time)
            
            # Close video to free resources
            video.close()
            
            return str(thumbnail_path)
        except Exception as e:
            raise ValueError(f"Failed to create thumbnail: {str(e)}") 