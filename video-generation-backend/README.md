# Video Generation Backend API

API FastAPI para mejorar scripts de videos usando OpenAI GPT-4o-mini, optimizada para YouTube Shorts.

## 🚀 Características

- **Mejora automática de scripts** usando GPT-4o-mini
- **Optimización para YouTube Shorts** (15-60 segundos)
- **Segmentación inteligente**: Hook, Contenido, CTA
- **Estimación de duración** precisa
- **Palabras clave SEO** automáticas
- **Múltiples categorías** de contenido
- **Validación robusta** con Pydantic
- **Manejo de errores** completo
- **CORS habilitado** para frontend
- **Documentación automática** con Swagger

## 📋 Requisitos

- Python 3.8+
- OpenAI API Key
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

## 📡 Endpoints

### `POST /mejorar-script`

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

## 🔧 Ejemplos de Uso

### cURL
```bash
# Mejorar script de tecnología
curl -X POST "http://localhost:8000/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Hoy aprenderemos Python",
    "categoria": "tech"
  }'

# Health check
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

### Docker (Próximamente)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Railway/Heroku
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

## 📝 Logs

El sistema incluye logging detallado:
```
2024-01-15 10:30:00 - app.main - INFO - Recibida solicitud para mejorar script de categoría: tech
2024-01-15 10:30:02 - app.services.openai_service - INFO - Script mejorado exitosamente. Duración: 45s
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al equipo de desarrollo.