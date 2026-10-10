from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import requests
import os
from dotenv import load_dotenv
import json
import traceback

# Load environment variables
load_dotenv()
UNSPLASH_API_KEY = os.getenv("UNSPLASH_API_KEY")
print(f"\n=== Environment Check ===")
print(f"UNSPLASH_API_KEY present: {bool(UNSPLASH_API_KEY)}")
if UNSPLASH_API_KEY:
    print(f"UNSPLASH_API_KEY length: {len(UNSPLASH_API_KEY)}")

router = APIRouter()

class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str = Field(..., min_length=1, description="The prompt to generate an image from")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A beautiful mountain landscape at sunset"
            }
        }

class ImageGenerationResponse(BaseModel):
    """Response model for image generation"""
    imageUrl: str = Field(..., description="The URL of the generated image")

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """
    Generate or retrieve an image based on the provided prompt.
    Currently using Unsplash API, but can be extended to use other services.
    """
    try:
        # Debug logging
        print("\n=== Image Generation Request ===")
        print(f"Raw request: {request}")
        print(f"Prompt: {request.prompt}")
        
        # Using Unsplash API
        if not UNSPLASH_API_KEY:
            print("Error: UNSPLASH_API_KEY not found in environment variables")
            raise HTTPException(status_code=500, detail="Unsplash API key not configured")

        # Search for an image using the prompt
        print("\nMaking request to Unsplash API...")
        print(f"Using API key (first 4 chars): {UNSPLASH_API_KEY[:4]}...")
        
        response = requests.get(
            "https://api.unsplash.com/photos/random",
            params={
                "query": request.prompt,
                "orientation": "landscape",
            },
            headers={
                "Authorization": f"Client-ID {UNSPLASH_API_KEY}",
                "Accept-Version": "v1"
            }
        )

        print(f"Unsplash API Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Raw Response Text: {response.text}")
            response_data = {}
        
        if response.status_code == 404:
            print("No images found, using fallback image")
            return ImageGenerationResponse(imageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe")
            
        if response.status_code != 200:
            error_message = response_data.get('errors', ['Unknown error'])[0] if response_data else response.text
            print(f"Error from Unsplash: {error_message}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch image from Unsplash: {error_message}"
            )

        image_url = response_data["urls"]["regular"]
        print(f"\nSuccessfully generated image URL: {image_url}")

        return ImageGenerationResponse(imageUrl=image_url)

    except HTTPException as he:
        print(f"\nHTTP Exception in generate_image: {he.detail}")
        raise he
    except Exception as e:
        print(f"\nUnexpected error in generate_image: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 