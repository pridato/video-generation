import asyncio
import logging
from typing import List, Optional
from datetime import datetime

# supabase-py client (sync). Si usas otro cliente, adapta.
from supabase import Client
from app.domain.entities.clip import AssetClip, VideoClip
from app.domain.repositories.clip_repository import ClipRepository
from app.infrastructure.models.asset_clip_model import AssetClipModel
from app.infrastructure.models.video_clip_model import VideoClipModel
