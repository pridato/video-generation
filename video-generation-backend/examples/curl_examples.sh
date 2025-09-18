#!/bin/bash

# Ejemplos de uso con cURL para la API Video Generation Backend
echo "🎬 Ejemplos de uso - Video Generation Backend API"
echo "=================================================="

# Variables
API_URL="http://localhost:8000"

echo ""
echo "🔍 1. Health Check"
echo "curl -X GET \"$API_URL/health\""
curl -X GET "$API_URL/health" | python -m json.tool

echo ""
echo ""
echo "🚀 2. Mejorar Script - Tecnología"
echo "curl -X POST \"$API_URL/mejorar-script\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"script\": \"Aprende Python en 60 segundos\", \"categoria\": \"tech\"}'"

curl -X POST "$API_URL/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{"script": "Aprende Python en 60 segundos. Es un lenguaje fácil y potente", "categoria": "tech"}' | python -m json.tool

echo ""
echo ""
echo "💼 3. Mejorar Script - Marketing"
echo "curl -X POST \"$API_URL/mejorar-script\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"script\": \"Cómo hacer marketing en redes sociales\", \"categoria\": \"marketing\"}'"

curl -X POST "$API_URL/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{"script": "Cómo hacer marketing en redes sociales efectivo para tu negocio", "categoria": "marketing"}' | python -m json.tool

echo ""
echo ""
echo "🏃 4. Mejorar Script - Fitness"
echo "curl -X POST \"$API_URL/mejorar-script\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"script\": \"Rutina de ejercicios en casa\", \"categoria\": \"fitness\"}'"

curl -X POST "$API_URL/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{"script": "Rutina de ejercicios en casa sin equipamiento para principiantes", "categoria": "fitness"}' | python -m json.tool

echo ""
echo ""
echo "❌ 5. Test de Error - Script muy corto"
echo "curl -X POST \"$API_URL/mejorar-script\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"script\": \"Hola\", \"categoria\": \"tech\"}'"

curl -X POST "$API_URL/mejorar-script" \
  -H "Content-Type: application/json" \
  -d '{"script": "Hola", "categoria": "tech"}' | python -m json.tool

echo ""
echo ""
echo "✅ Ejemplos completados"
echo "📚 Documentación completa en: $API_URL/docs"