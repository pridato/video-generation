"""
General helper utilities
"""
import os
import uuid
import time
from typing import List, Dict, Any, Optional
from pathlib import Path


def generate_unique_id() -> str:
    """
    Generate a unique identifier
    """
    return str(uuid.uuid4())


def generate_timestamp_filename(prefix: str = "", extension: str = "") -> str:
    """
    Generate a timestamp-based filename
    """
    timestamp = str(int(time.time()))
    if prefix:
        filename = f"{prefix}_{timestamp}"
    else:
        filename = timestamp

    if extension:
        filename += f".{extension.lstrip('.')}"

    return filename


def ensure_directory_exists(directory_path: str) -> None:
    """
    Ensure directory exists, create if it doesn't
    """
    Path(directory_path).mkdir(parents=True, exist_ok=True)


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable format
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        remaining_seconds = seconds % 60
        return f"{minutes}m {remaining_seconds:.1f}s"
    else:
        hours = int(seconds // 3600)
        remaining_minutes = int((seconds % 3600) // 60)
        remaining_seconds = seconds % 60
        return f"{hours}h {remaining_minutes}m {remaining_seconds:.1f}s"


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in bytes to human-readable format
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split a list into chunks of specified size
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge multiple dictionaries, with later dicts taking precedence
    """
    result = {}
    for d in dicts:
        result.update(d)
    return result


def extract_keywords_from_text(text: str, max_keywords: int = 10) -> List[str]:
    """
    Extract potential keywords from text
    Simple implementation - can be enhanced with NLP libraries
    """
    import re
    from collections import Counter

    # Basic preprocessing
    text = text.lower()
    # Remove punctuation and split into words
    words = re.findall(r'\b\w+\b', text)

    # Filter out common stop words (simplified list)
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
        'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'hers',
        'its', 'our', 'their', 'what', 'when', 'where', 'why', 'how', 'which',
        'who', 'whom', 'whose', 'if', 'then', 'else', 'while', 'during', 'before',
        'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
        'again', 'further', 'then', 'once'
    }

    # Filter meaningful words
    meaningful_words = [
        word for word in words
        if len(word) > 3 and word not in stop_words
    ]

    # Count word frequency
    word_counts = Counter(meaningful_words)

    # Return most common words
    return [word for word, _ in word_counts.most_common(max_keywords)]