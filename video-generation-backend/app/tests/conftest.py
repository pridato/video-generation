"""
Test configuration and fixtures
"""
import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    test_settings = settings.copy()
    test_settings.DEBUG = True
    test_settings.ENVIRONMENT = "testing"
    return test_settings


@pytest.fixture
def sample_script():
    """Sample script for testing"""
    return "This is a sample script for testing purposes."


@pytest.fixture
def sample_audio_request():
    """Sample audio generation request"""
    return {
        "text": "Hello, this is a test audio generation.",
        "voice_id": "alloy"
    }


@pytest.fixture
def sample_clip_request():
    """Sample clip selection request"""
    return {
        "category": "tech",
        "enhanced_script": "This is an enhanced script about technology.",
        "audio_duration": 30.0
    }