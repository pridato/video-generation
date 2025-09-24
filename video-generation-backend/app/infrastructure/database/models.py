"""
Database models using SQLAlchemy for the video generation application
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class TipoSuscripcionDB(enum.Enum):
    GRATUITO = "gratuito"
    BASICO = "basico"
    PREMIUM = "premium"
    EMPRESARIAL = "empresarial"


class EstadoUsuarioDB(enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"
    BLOQUEADO = "bloqueado"


class TonoScriptDB(enum.Enum):
    EDUCATIVO = "educativo"
    VIRAL = "viral"
    PROFESIONAL = "profesional"
    CASUAL = "casual"
    ENERGETICO = "energetico"


class CategoriaDB(enum.Enum):
    TECH = "tech"
    MARKETING = "marketing"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    LIFESTYLE = "lifestyle"
    BUSINESS = "business"
    FITNESS = "fitness"
    FOOD = "food"
    TRAVEL = "travel"
    NEWS = "news"


class EstadoVideoDB(enum.Enum):
    PENDIENTE = "pendiente"
    PROCESANDO = "procesando"
    COMPLETADO = "completado"
    FALLIDO = "fallido"
    CANCELADO = "cancelado"


class CalidadVideoDB(enum.Enum):
    SD = "sd"
    HD = "hd"
    FHD = "fhd"


class TipoVozDB(enum.Enum):
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"


class UsuarioDB(Base):
    """Modelo de base de datos para usuarios."""
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    nombre = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    tipo_suscripcion = Column(Enum(TipoSuscripcionDB), default=TipoSuscripcionDB.GRATUITO)
    estado = Column(Enum(EstadoUsuarioDB), default=EstadoUsuarioDB.ACTIVO)
    videos_generados_mes_actual = Column(Integer, default=0)
    total_videos_generados = Column(Integer, default=0)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    ultima_actividad = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String, nullable=True, unique=True)
    preferencias = Column(JSON, default=dict)

    # Relaciones
    scripts = relationship("ScriptDB", back_populates="usuario")
    videos = relationship("VideoDB", back_populates="usuario")


class ScriptDB(Base):
    """Modelo de base de datos para scripts."""
    __tablename__ = "scripts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    texto_original = Column(Text, nullable=False)
    texto_mejorado = Column(Text, nullable=True)
    duracion_objetivo = Column(Integer, nullable=False)  # segundos
    tono = Column(Enum(TonoScriptDB), nullable=False)
    audiencia_objetivo = Column(String, nullable=False)
    categoria = Column(Enum(CategoriaDB), nullable=False)
    palabras_clave = Column(ARRAY(String), default=list)
    mejoras_aplicadas = Column(ARRAY(String), default=list)
    embedding = Column(ARRAY(Float), nullable=True)  # 768 dimensiones
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    # Relaciones
    usuario = relationship("UsuarioDB", back_populates="scripts")
    segmentos = relationship("SegmentoScriptDB", back_populates="script", cascade="all, delete-orphan")
    videos = relationship("VideoDB", back_populates="script")


class SegmentoScriptDB(Base):
    """Modelo de base de datos para segmentos de scripts."""
    __tablename__ = "segmentos_script"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    script_id = Column(String, ForeignKey("scripts.id"), nullable=False)
    texto = Column(Text, nullable=False)
    duracion = Column(Integer, nullable=False)  # segundos
    tipo = Column(String, nullable=False)  # hook, contenido, cta
    posicion = Column(Integer, nullable=False)

    # Relaciones
    script = relationship("ScriptDB", back_populates="segmentos")


class TemplateDB(Base):
    """Modelo de base de datos para templates de video."""
    __tablename__ = "templates"

    id = Column(String, primary_key=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    es_premium = Column(Boolean, default=False)
    configuracion = Column(JSON, default=dict)
    preview_url = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    videos = relationship("VideoDB", back_populates="template")


class VideoDB(Base):
    """Modelo de base de datos para videos."""
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=False)
    script_id = Column(String, ForeignKey("scripts.id"), nullable=False)
    template_id = Column(String, ForeignKey("templates.id"), nullable=False)
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    duracion_objetivo = Column(Integer, nullable=False)  # segundos
    duracion_final = Column(Float, nullable=True)  # duración real del video
    calidad = Column(Enum(CalidadVideoDB), default=CalidadVideoDB.HD)
    estado = Column(Enum(EstadoVideoDB), default=EstadoVideoDB.PENDIENTE)
    url_video_final = Column(String, nullable=True)
    url_thumbnail = Column(String, nullable=True)

    # Configuración de audio (JSON)
    audio_config = Column(JSON, default=dict)  # voz, velocidad, volumen, etc.

    # Metadatos y estadísticas
    metadatos = Column(JSON, default=dict)
    estadisticas = Column(JSON, default=dict)
    error_mensaje = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    procesado_at = Column(DateTime, nullable=True)

    # Relaciones
    usuario = relationship("UsuarioDB", back_populates="videos")
    script = relationship("ScriptDB", back_populates="videos")
    template = relationship("TemplateDB", back_populates="videos")
    clips = relationship("ClipVideoDB", back_populates="video", cascade="all, delete-orphan")


class ClipVideoDB(Base):
    """Modelo de base de datos para clips seleccionados en videos."""
    __tablename__ = "clips_video"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    clip_id = Column(String, nullable=False)  # ID del clip original
    url = Column(String, nullable=False)
    duracion = Column(Float, nullable=False)
    posicion_inicio = Column(Float, nullable=False)  # tiempo donde inicia en el video
    posicion_fin = Column(Float, nullable=False)     # tiempo donde termina en el video
    orden = Column(Integer, nullable=False)          # orden en el video
    relevancia_score = Column(Float, default=0.0)
    metadatos = Column(JSON, default=dict)

    # Relaciones
    video = relationship("VideoDB", back_populates="clips")


class LogProcesamiento(Base):
    """Modelo para logs de procesamiento de videos."""
    __tablename__ = "logs_procesamiento"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    paso = Column(String, nullable=False)  # script_enhancement, audio_generation, etc.
    estado = Column(String, nullable=False)  # started, completed, failed
    mensaje = Column(Text, nullable=True)
    datos = Column(JSON, nullable=True)  # datos específicos del paso
    timestamp = Column(DateTime, default=datetime.utcnow)


class UsageLog(Base):
    """Modelo para logs de uso de la API."""
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=True)
    endpoint = Column(String, nullable=False)
    metodo = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    respuesta_codigo = Column(Integer, nullable=False)
    tiempo_respuesta = Column(Float, nullable=True)  # milisegundos
    timestamp = Column(DateTime, default=datetime.utcnow)