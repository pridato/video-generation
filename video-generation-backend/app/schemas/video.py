"""
Video generation schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class VideoGenerationRequest(BaseModel):
    script_metadata: Dict[str, Any] = Field(
        ...,
        description="Complete script metadata with audio and clips data"
    )
    title: str = Field(
        default="Generated Video",
        description="Video title"
    )
    user_id: Optional[str] = Field(
        default=None,
        description="User ID (optional)"
    )


class VideoGenerationResponse(BaseModel):
    success: bool = Field(..., description="Generation success status")
    message: str = Field(..., description="Response message")
    video_id: str = Field(..., description="Generated video ID")
    video_url: str = Field(..., description="Video file URL")
    thumbnail_url: Optional[str] = Field(
        default=None,
        description="Thumbnail URL"
    )
    duration: float = Field(..., ge=0, description="Video duration in seconds")
    file_size: int = Field(..., description="Video file size in bytes")
    title: str = Field(..., description="Video title")