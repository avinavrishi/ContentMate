from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from app.services.video_service import VideoService

router = APIRouter()

@router.post("/upload")
async def upload_resources(files: List[UploadFile] = File(...)):
    """
    Upload multiple resource files.
    Returns a list of file paths where the resources were saved.
    """
    try:
        paths = []
        for file in files:
            contents = await file.read()
            file_path = await VideoService.save_resource(contents, file.filename)
            paths.append(file_path)
        return {"paths": paths, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 