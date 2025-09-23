"""
Clip selection and search schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.common import CategoriaEnum


class ClipSelectionRequest(BaseModel):
    category: CategoriaEnum = Field(..., description="Content category")
    enhanced_script: str = Field(..., description="Enhanced script text")
    audio_duration: float = Field(
        ...,
        ge=0,
        description="Real audio duration in seconds"
    )
    segmentos: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Script segments with timing"
    )
    target_clips_count: Optional[int] = Field(
        default=None,
        ge=1,
        le=20,
        description="Target number of clips"
    )


class SelectedClipInfo(BaseModel):
    clip_id: str = Field(..., description="Unique clip ID")
    filename: str = Field(..., description="Clip filename")
    file_url: str = Field(..., description="Clip file URL")
    duration: float = Field(..., description="Clip duration in seconds")
    segment_text: str = Field(..., description="Associated segment text")
    segment_type: str = Field(..., description="Segment type (hook, content, cta)")
    similarity_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Semantic similarity score"
    )
    segment_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Segment-specific score"
    )
    final_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Final combined score"
    )
    duration_compatibility: float = Field(
        ...,
        ge=0,
        le=1,
        description="Duration compatibility"
    )
    quality_score: float = Field(..., description="Clip quality score")
    motion_intensity: str = Field(..., description="Motion intensity")
    concept_tags: List[str] = Field(default=[], description="Concept tags")
    emotion_tags: List[str] = Field(default=[], description="Emotion tags")
    dominant_colors: List[str] = Field(default=[], description="Dominant colors")


class TimelineClipAssignment(BaseModel):
    clip: Dict[str, Any] = Field(..., description="Clip information")
    segment: Dict[str, Any] = Field(..., description="Segment information")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    clip_role: str = Field(..., description="Clip role (main, transition, filler)")
    similarity_score: float = Field(..., description="Similarity score")
    segment_score: float = Field(..., description="Segment-specific score")
    final_score: float = Field(..., description="Final combined score")


class ClipSelectionResponse(BaseModel):
    success: bool = Field(..., description="Selection success status")
    message: str = Field(..., description="Response message")
    selected_clips: List[SelectedClipInfo] = Field(
        ...,
        description="List of selected clips"
    )
    total_selected: int = Field(..., description="Total number of clips selected")
    selection_criteria: Optional[Dict[str, Any]] = Field(
        default={},
        description="Selection criteria used"
    )
    timeline_assignments: Optional[List[TimelineClipAssignment]] = Field(
        default=None,
        description="Precise temporal clip assignments"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default={},
        description="Additional metadata"
    )


class ClipSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Search query"
    )
    category: str = Field(
        default="all",
        description="Category to filter clips ('all' for no filter)"
    )
    similarity_threshold: Optional[float] = Field(
        default=0.3,
        ge=0,
        le=1,
        description="Minimum similarity threshold"
    )


class ClipSearchResult(BaseModel):
    clip_id: str = Field(..., description="Unique clip ID")
    filename: str = Field(..., description="Clip filename")
    file_url: str = Field(..., description="Clip file URL")
    similarity_score: float = Field(..., description="Similarity score")
    quality_score: float = Field(..., description="Quality score")
    duration: float = Field(..., description="Duration in seconds")
    description: str = Field(..., description="Clip description")
    concept_tags: List[str] = Field(default=[], description="Concept tags")
    keywords: List[str] = Field(default=[], description="Keywords")


class ClipSearchResponse(BaseModel):
    success: bool = Field(..., description="Search success status")
    message: str = Field(..., description="Response message")
    results: List[ClipSearchResult] = Field(..., description="Search results")
    total_results: int = Field(..., description="Total results found")
    query: str = Field(..., description="Original query")
    category: str = Field(..., description="Category filter applied")