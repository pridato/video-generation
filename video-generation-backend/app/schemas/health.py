"""
Health check schemas
"""
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Service status")
    message: str = Field(default="Service is running", description="Status message")
    version: str = Field(default="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: str = Field(default="", description="Additional error details")
    code: int = Field(..., description="HTTP error code")