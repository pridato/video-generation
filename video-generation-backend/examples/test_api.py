#!/usr/bin/env python3
"""
Ejemplos de uso de la API Video Generation Backend
"""

import requests
import json

# Configuración
API_BASE_URL = "http://localhost:8000"

def test_health():
    """Test del endpoint de health"""
    print("🔍 Probando health check...")

    response = requests.get(f"{API_BASE_URL}/health")

    if response.status_code == 200:
        data = response.json()
        print("✅ Health check exitoso:")
        print(f"   Status: {data['status']}")
        print(f"   Version: {data['version']}")
        print(f"   OpenAI configurado: {data['openai_configured']}")
    else:
        print(f"❌ Error en health check: {response.status_code}")

    print("-" * 50)

def test_mejorar_script():
    """Test del endpoint principal"""
    print("🚀 Probando mejora de script...")

    # Ejemplo 1: Script de tecnología
    script_tech = {
        "script": "Hoy vamos a aprender sobre React hooks. Son muy útiles para manejar estado.",
        "categoria": "tech"
    }

    print(f"📝 Script original: {script_tech['script']}")
    print(f"🏷️  Categoría: {script_tech['categoria']}")

    response = requests.post(
        f"{API_BASE_URL}/mejorar-script",
        json=script_tech,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        data = response.json()
        print("✅ Script mejorado exitosamente:")
        print(f"   📊 Duración estimada: {data['duracion_estimada']}s")
        print(f"   🎭 Tono: {data['tono']}")
        print(f"   🔑 Palabras clave: {', '.join(data['palabras_clave'])}")
        print(f"   🛠️  Mejoras: {', '.join(data['mejoras_aplicadas'])}")
        print("\n📝 Script mejorado:")
        print(f"   {data['script_mejorado']}")
        print("\n🎬 Segmentos:")
        for i, segmento in enumerate(data['segmentos'], 1):
            print(f"   {i}. [{segmento['tipo'].upper()}] ({segmento['duracion']}s): {segmento['texto']}")
    else:
        print(f"❌ Error mejorando script: {response.status_code}")
        print(f"   {response.text}")

    print("-" * 50)

def test_diferentes_categorias():
    """Test con diferentes categorías"""
    print("🎯 Probando diferentes categorías...")

    ejemplos = [
        {
            "script": "Consejos para hacer ejercicio en casa sin equipamiento",
            "categoria": "fitness"
        },
        {
            "script": "Estrategias de marketing digital para pequeñas empresas",
            "categoria": "marketing"
        },
        {
            "script": "Receta rápida de pasta con ajo y aceite de oliva",
            "categoria": "food"
        }
    ]

    for ejemplo in ejemplos:
        print(f"\n🧪 Probando categoría: {ejemplo['categoria']}")

        response = requests.post(
            f"{API_BASE_URL}/mejorar-script",
            json=ejemplo,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Duración: {data['duracion_estimada']}s | Tono: {data['tono']}")
            print(f"   📝 Hook: {data['segmentos'][0]['texto'][:50]}...")
        else:
            print(f"   ❌ Error: {response.status_code}")

    print("-" * 50)

def test_errores():
    """Test de manejo de errores"""
    print("⚠️  Probando manejo de errores...")

    # Script muy corto
    response = requests.post(
        f"{API_BASE_URL}/mejorar-script",
        json={"script": "Hola", "categoria": "tech"}
    )

    print(f"📝 Script muy corto: {response.status_code} - {response.json().get('detail', 'No detail')}")

    # Categoría inválida
    response = requests.post(
        f"{API_BASE_URL}/mejorar-script",
        json={"script": "Este es un script válido para probar errores", "categoria": "categoria_inexistente"}
    )

    print(f"🏷️  Categoría inválida: {response.status_code}")

    print("-" * 50)

if __name__ == "__main__":
    print("🎬 Probando API Video Generation Backend")
    print("=" * 50)

    try:
        test_health()
        test_mejorar_script()
        test_diferentes_categorias()
        test_errores()

        print("🎉 Todas las pruebas completadas")

    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar a la API. ¿Está ejecutándose en http://localhost:8000?")
        print("💡 Ejecuta: python start.py")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")