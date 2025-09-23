# 🚀 Video Generation Backend API

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

**API backend refactorizada siguiendo las mejores prácticas de FastAPI para la generación automática de contenido de video con IA**

[📖 Documentación API](http://localhost:8000/docs) • [🔄 ReDoc](http://localhost:8000/redoc) • [🏠 Proyecto Principal](../README.md)

</div>

## 🚀 Características Principales

### 🤖 **Inteligencia Artificial**
- **Mejora automática de scripts** usando GPT-4o-mini
- **Optimización para YouTube Shorts** (15-60 segundos)
- **Segmentación inteligente**: Hook (5-8s) + Contenido (40-45s) + CTA (5-8s)
- **Estimación de duración** precisa (2 palabras/segundo)
- **Palabras clave SEO** automáticas por categoría

### 📊 **10 Categorías Soportadas**
- `tech` - Tecnología y programación
- `marketing` - Marketing y ventas
- `education` - Educación y tutoriales
- `entertainment` - Entretenimiento
- `lifestyle` - Estilo de vida
- `business` - Negocios
- `fitness` - Fitness y salud
- `food` - Comida y cocina
- `travel` - Viajes
- `news` - Noticias

### 🛡️ **Arquitectura Robusta - REFACTORIZADA**
- **Estructura FastAPI Best Practices** ✨
- **Separación de responsabilidades** (API, Core, Services, Schemas)
- **Validación robusta** con Pydantic v2
- **Versionado de API** (/api/v1/)
- **Dependencias centralizadas** y reutilizables
- **Schemas tipados** para request/response
- **Utils y helpers** organizados
- **Testing structure** preparada
- **Logging estructurado** para monitoreo
- **Health checks** integrados
- **CORS habilitado** para frontend
- **Documentación automática** con Swagger UI + ReDoc

## 🏗️ **Nueva Estructura del Proyecto - REFACTORIZADA**

```
app/
├── api/                    # API layer
│   ├── deps.py            # Dependencias comunes
│   └── v1/                # API v1
│       ├── api.py         # Main router v1
│       └── routes/        # Endpoints específicos
│           ├── health.py  # Health checks
│           ├── script.py  # Script enhancement
│           ├── audio.py   # Audio generation
│           ├── clips.py   # Clip management
│           └── video.py   # Video generation
├── core/                  # Core configuration
│   └── config.py         # Settings y configuración
├── schemas/               # Pydantic models
│   ├── common.py         # Enums y tipos comunes
│   ├── health.py         # Health schemas
│   ├── script.py         # Script schemas
│   ├── audio.py          # Audio schemas
│   ├── clips.py          # Clips schemas
│   └── video.py          # Video schemas
├── services/              # Business logic
│   ├── openai_service.py
│   ├── clip_selection_service.py
│   ├── embedding_service.py
│   └── video_assembly_service.py
├── utils/                 # Utilidades
│   ├── logging.py        # Configuración de logs
│   ├── validation.py     # Validaciones
│   └── helpers.py        # Helpers generales
├── tests/                 # Tests
│   ├── conftest.py       # Configuración de tests
│   └── test_*.py         # Test modules
└── main.py               # FastAPI app entrypoint
```

## 📋 Requisitos

- Python 3.8+
- OpenAI API Key
- Supabase Database
- FastAPI
- Uvicorn

## 🛠️ Instalación

1. **Clonar y configurar**:
```bash
cd video-generation-backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tu OpenAI API Key
```

3. **Ejecutar servidor**:
```bash
# Desarrollo
python -m app.main

# O con uvicorn directamente
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 **Endpoints API v1 - NUEVA ESTRUCTURA**

**Base URL**: `/api/v1`

Todas las rutas ahora están versionadas y organizadas por funcionalidad:

### **Health Check**
- `GET /api/v1/health` - Estado del sistema

### **Script Enhancement**
- `POST /api/v1/mejorar-script` - Mejorar script con IA

### **Audio Generation**
- `POST /api/v1/generar-voz` - Generar audio desde texto

### **Clip Management**
- `POST /api/v1/seleccionar-clips` - Selección inteligente de clips
- `POST /api/v1/buscar-clips` - Búsqueda de clips por texto

### **Video Generation**
- `POST /api/v1/generar-video` - Ensamblar video completo

---

### `POST /api/v1/mejorar-script`

Mejora un script para YouTube Shorts.

**Request:**
```json
{
  "script": "Hoy vamos a aprender sobre React hooks",
  "categoria": "tech"
}
```

**Response:**
```json
{
  "script_mejorado": "🔥 ¿Sabías que React hooks pueden cambiar tu vida como developer? En los próximos 45 segundos te enseño el secreto que todo programador debe conocer...",
  "duracion_estimada": 45,
  "segmentos": [
    {
      "texto": "🔥 ¿Sabías que React hooks pueden cambiar tu vida como developer?",
      "duracion": 8,
      "tipo": "hook"
    },
    {
      "texto": "En los próximos segundos te enseño 3 hooks esenciales: useState para manejar estado, useEffect para efectos secundarios y useContext para compartir datos...",
      "duracion": 32,
      "tipo": "contenido"
    },
    {
      "texto": "¡Dale like si te sirvió y sígueme para más tips de React!",
      "duracion": 5,
      "tipo": "cta"
    }
  ],
  "palabras_clave": ["React", "hooks", "useState", "useEffect", "desarrollo"],
  "tono": "educativo",
  "mejoras_aplicadas": [
    "Hook emocional añadido",
    "Estructura de 3 puntos clave",
    "CTA específico agregado",
    "Emojis para engagement"
  ]
}
```

### `GET /health`

Health check del servicio.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "openai_configured": true
}
```

## 🎯 Categorías Soportadas

- `tech` - Tecnología y programación
- `marketing` - Marketing y ventas
- `education` - Educación y tutoriales
- `entertainment` - Entretenimiento
- `lifestyle` - Estilo de vida
- `business` - Negocios
- `fitness` - Fitness y salud
- `food` - Comida y cocina
- `travel` - Viajes
- `news` - Noticias

## 🔧 Ejemplos de Uso Avanzados

### 📊 **Scripts por Categoría**

#### Tecnología (tech)
```bash
curl -X POST "http://localhost:8000/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Hoy aprenderemos React hooks y cómo useState puede cambiar tu forma de programar",
    "categoria": "tech"
  }'
```

#### Marketing (marketing)
```bash
curl -X POST "http://localhost:8000/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Te enseño 3 estrategias de marketing digital que aumentaron mis ventas 300%",
    "categoria": "marketing"
  }'
```

#### Educación (education)
```bash
curl -X POST "http://localhost:8000/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "La fórmula matemática que todo estudiante debe conocer para resolver ecuaciones rápidamente",
    "categoria": "education"
  }'
```

### 🔍 **Health Check**
```bash
curl "http://localhost:8000/health"
```

### Python
```python
import requests

# Mejorar script
response = requests.post(
    "http://localhost:8000/mejorar-script",
    json={
        "script": "Tips para ser más productivo",
        "categoria": "lifestyle"
    }
)

result = response.json()
print(f"Duración estimada: {result['duracion_estimada']}s")
print(f"Script mejorado: {result['script_mejorado']}")
```

### JavaScript/Fetch
```javascript
// Mejorar script desde frontend
const response = await fetch('http://localhost:8000/mejorar-script', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    script: 'Como hacer marketing digital',
    categoria: 'marketing'
  })
});

const result = await response.json();
console.log('Script mejorado:', result.script_mejorado);
```

## ⚡ Características Técnicas

### Optimización de Scripts
- **Hook potente** (5-8s): Captura atención inmediata
- **Contenido estructurado** (40-45s): Información valiosa y clara
- **CTA efectivo** (5-8s): Llamada a la acción que genera engagement

### Cálculo de Duración
- **Velocidad de habla**: 2 palabras por segundo
- **Validación automática**: Entre 15-60 segundos
- **Segmentación precisa** por tipo de contenido

### Palabras Clave SEO
- **Extracción automática** de términos relevantes
- **Optimización por categoría** específica
- **Integración natural** en el contenido

## 🛡️ Manejo de Errores

### Rate Limits
```json
{
  "error": "Límite de rate de OpenAI excedido",
  "detail": "Intenta nuevamente en unos minutos",
  "code": 400
}
```

### API Key Inválida
```json
{
  "error": "API key de OpenAI inválida",
  "detail": "Verificar configuración",
  "code": 503
}
```

### Script Muy Corto
```json
{
  "error": "El script debe tener al menos 5 palabras",
  "detail": "Proporciona más contenido",
  "code": 400
}
```

## 📊 Documentación Interactiva

Una vez ejecutando el servidor:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
OPENAI_API_KEY=sk-your-api-key-here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
```

### Personalización
- Modifica `WORDS_PER_SECOND` en `config.py` para ajustar velocidad de habla
- Ajusta `TARGET_DURATION_MIN/MAX` para cambiar rangos de duración
- Personaliza prompts en `openai_service.py` para diferentes estilos

## 🚀 Deployment

### 🐳 **Docker**
```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t shortsai-backend .
docker run -p 8000:8000 --env-file .env shortsai-backend
```

### 🌐 **Railway**
1. Conectar repositorio desde GitHub
2. Configurar variables de entorno:
   ```
   OPENAI_API_KEY=sk-your-key-here
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
3. Deploy automático con cada push

### 🟣 **Heroku**
```bash
# Heroku CLI deployment
heroku create shortsai-backend
heroku config:set OPENAI_API_KEY=sk-your-key-here
heroku config:set CORS_ORIGINS=https://your-frontend.vercel.app
git push heroku main
```

### ☁️ **AWS/GCP**
- **AWS Lambda** con Serverless Framework
- **Google Cloud Run** para contenedores
- **Azure Container Instances**

## 📝 Logs & Monitoring

### 📊 **Logging Estructurado**
El sistema incluye logging detallado:
```
2024-01-15 10:30:00 - app.main - INFO - Recibida solicitud para mejorar script de categoría: tech
2024-01-15 10:30:02 - app.services.openai_service - INFO - Script mejorado exitosamente. Duración: 45s
2024-01-15 10:30:02 - app.main - INFO - Respuesta enviada correctamente
```

### 📊 **Metrics & Monitoring**
- **Health Endpoint:** `/health` para health checks
- **Prometheus Metrics** (próximamente)
- **Error Tracking** con Sentry (próximamente)
- **Performance Monitoring** con DataDog (próximamente)

### 🚨 **Alertas**
- **Rate Limiting:** Máx 100 requests/min por IP
- **OpenAI API Errors:** Retry automático con backoff
- **Memory Usage:** Alertas por encima del 80%
- **Response Time:** Alertas por encima de 5s

## 🧪 Testing

### 📝 **Unit Tests**
```bash
# Ejecutar todos los tests
python -m pytest tests/ -v

# Tests con coverage
python -m pytest tests/ --cov=app --cov-report=html

# Tests de integración
python -m pytest tests/integration/ -v
```

### 🔍 **Ejemplo de Test**
```python
# tests/test_script_enhancement.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_mejorar_script_tech():
    response = client.post(
        "/mejorar-script",
        json={
            "script": "Aprende Python en 5 minutos",
            "categoria": "tech"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "script_mejorado" in data
    assert data["duracion_estimada"] >= 15
    assert data["duracion_estimada"] <= 60
```

### 🔒 **Security Testing**
```bash
# SQL Injection tests
python -m pytest tests/security/ -k sql_injection

# Input validation tests
python -m pytest tests/security/ -k input_validation

# Rate limiting tests
python -m pytest tests/security/ -k rate_limit
```

## 🔒 Seguridad

### 🛡️ **Medidas de Seguridad**
- **Input Validation:** Pydantic models con validación estricta
- **CORS Policy:** Dominios específicos permitidos
- **Rate Limiting:** Protección contra spam y ataques DDoS
- **Error Handling:** No exposición de información sensible
- **API Key Protection:** Variables de entorno seguras
- **HTTPS Only:** Forzado en producción

### 🔑 **Variables Sensibles**
```bash
# Nunca commitear estas variables
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key

# Usar .env o variables de entorno del sistema
export OPENAI_API_KEY="sk-your-key-here"
```

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crear rama** para feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Escribir tests** para la nueva funcionalidad
4. **Commit** cambios (`git commit -m 'Agregar nueva funcionalidad'`)
5. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
6. **Abrir Pull Request** con descripción detallada

### 📝 **Guías de Contribución**
- **Código:** Seguir PEP 8 y usar Black para formateo
- **Tests:** Mínimo 80% de coverage
- **Documentación:** Actualizar README y docstrings
- **Commits:** Mensajes descriptivos en español

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al equipo de desarrollo.