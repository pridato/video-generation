"""
Validation utilities
"""
import re
from typing import List, Dict, Any, Optional


def validate_script_content(script: str) -> Dict[str, Any]:
    """
    Validate script content and return analysis
    """
    if not script or not script.strip():
        return {"valid": False, "error": "Script cannot be empty"}

    word_count = len(script.split())
    char_count = len(script)

    return {
        "valid": True,
        "word_count": word_count,
        "char_count": char_count,
        "estimated_duration": word_count / 2.5  # ~2.5 words per second
    }


def validate_audio_duration(duration: float) -> bool:
    """
    Validate audio duration is within acceptable limits
    """
    return 5.0 <= duration <= 300.0  # 5 seconds to 5 minutes


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Validate file has allowed extension
    """
    if not filename:
        return False

    extension = filename.lower().split('.')[-1]
    return extension in [ext.lower().strip('.') for ext in allowed_extensions]


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    """
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove multiple underscores
    filename = re.sub(r'_+', '_', filename)
    # Trim underscores from start/end
    filename = filename.strip('_')
    return filename


def validate_clip_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate clip metadata structure
    """
    required_fields = ['clip_id', 'filename', 'duration', 'file_url']

    validation = {
        "valid": True,
        "missing_fields": [],
        "errors": []
    }

    for field in required_fields:
        if field not in metadata:
            validation["missing_fields"].append(field)
            validation["valid"] = False

    # Validate duration
    if 'duration' in metadata:
        try:
            duration = float(metadata['duration'])
            if duration <= 0:
                validation["errors"].append("Duration must be positive")
                validation["valid"] = False
        except (ValueError, TypeError):
            validation["errors"].append("Duration must be a number")
            validation["valid"] = False

    return validation