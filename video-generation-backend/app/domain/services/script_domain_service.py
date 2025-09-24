"""
Script domain service - Contains complex business logic for scripts
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

from ..entities.script import Script, ScriptSegment, SegmentType, Tone, Category


class ScriptDomainService:
    """Servicio de dominio para lógica compleja de scripts."""

    @staticmethod
    def calcular_duracion_estimada(texto: str, palabras_por_segundo: float = 2.0) -> float:
        """Calcula la duración estimada del script basada en el texto."""
        if not texto:
            return 0.0

        palabras = len(texto.split())
        return palabras / palabras_por_segundo

    @staticmethod
    def generar_segmentos_automaticos(script: Script) -> List[ScriptSegment]:
        """Genera segmentos automáticamente basado en el texto del script."""
        if not script.enhanced_text:
            return []

        texto = script.enhanced_text
        oraciones = re.split(r'[.!?]+', texto)
        oraciones = [o.strip() for o in oraciones if o.strip()]

        if not oraciones:
            return []

        segmentos = []
        total_oraciones = len(oraciones)

        # Hook: Primera parte (15-25%)
        hook_end = max(1, int(total_oraciones * 0.2))
        hook_texto = '. '.join(oraciones[:hook_end]) + '.'
        hook_duracion = int(
            ScriptDomainService.calcular_duracion_estimada(hook_texto))
        segmentos.append(ScriptSegment(
            text=hook_texto,
            duration=hook_duracion,
            type=SegmentType.HOOK,
            position=0
        ))

        # Contenido: Parte media (60-70%)
        contenido_start = hook_end
        contenido_end = max(hook_end + 1, int(total_oraciones * 0.85))
        contenido_texto = '. '.join(
            oraciones[contenido_start:contenido_end]) + '.'
        contenido_duracion = int(
            ScriptDomainService.calcular_duracion_estimada(contenido_texto))
        segmentos.append(ScriptSegment(
            text=contenido_texto,
            duration=contenido_duracion,
            type=SegmentType.CONTENIDO,
            position=1
        ))

        # CTA: Última parte (10-25%)
        if contenido_end < total_oraciones:
            cta_texto = '. '.join(oraciones[contenido_end:]) + '.'
            cta_duracion = int(
                ScriptDomainService.calcular_duracion_estimada(cta_texto))
            segmentos.append(ScriptSegment(
                text=cta_texto,
                duration=cta_duracion,
                type=SegmentType.CTA,
                position=2
            ))

        return segmentos

    @staticmethod
    def extraer_palabras_clave(texto: str, max_keywords: int = 10) -> List[str]:
        """Extrae palabras clave relevantes del texto."""
        if not texto:
            return []

        # Palabras comunes a excluir
        stop_words = {
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo',
            'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'del', 'al', 'las',
            'pero', 'sus', 'les', 'me', 'si', 'ya', 'muy', 'más', 'como', 'sobre',
            'este', 'esta', 'estos', 'estas', 'todo', 'todos', 'todas', 'puede',
            'pueden', 'ser', 'estar', 'tener', 'hacer', 'video', 'videos'
        }

        # Limpiar y tokenizar texto
        texto_limpio = re.sub(r'[^\w\s]', ' ', texto.lower())
        palabras = texto_limpio.split()

        # Filtrar palabras
        palabras_filtradas = [
            palabra for palabra in palabras
            if len(palabra) > 3 and palabra not in stop_words
        ]

        # Contar frecuencias
        frecuencias = {}
        for palabra in palabras_filtradas:
            frecuencias[palabra] = frecuencias.get(palabra, 0) + 1

        # Ordenar por frecuencia y tomar las top N
        keywords = sorted(frecuencias.items(),
                          key=lambda x: x[1], reverse=True)
        return [palabra for palabra, _ in keywords[:max_keywords]]

    @staticmethod
    def optimizar_para_duracion(script: Script, duracion_objetivo: int, tolerancia: int = 3) -> str:
        """Optimiza el script para cumplir con la duración objetivo."""
        if not script.enhanced_text:
            return script.original_text

        duracion_actual = script.estimated_duration
        diferencia = abs(duracion_actual - duracion_objetivo)

        if diferencia <= tolerancia:
            return script.enhanced_text

        if duracion_actual > duracion_objetivo:
            # Reducir texto
            factor_reduccion = duracion_objetivo / duracion_actual
            palabras = script.enhanced_text.split()
            palabras_objetivo = int(len(palabras) * factor_reduccion)
            return ' '.join(palabras[:palabras_objetivo])
        else:
            # El texto es muy corto, se mantiene como está
            # La extensión debería manejarse en la capa de aplicación con IA
            return script.enhanced_text

    @staticmethod
    def validar_calidad_script(script: Script) -> Dict[str, Any]:
        """Valida la calidad del script y retorna métricas."""
        validaciones = {
            'longitud_adecuada': False,
            'duracion_objetivo': False,
            'tiene_segmentos': False,
            'tiene_hook': False,
            'tiene_cta': False,
            'densidad_palabras_clave': 0.0,
            'score_calidad': 0.0
        }

        if not script.enhanced_text:
            return validaciones

        # Validar longitud
        longitud = len(script.enhanced_text)
        validaciones['longitud_adecuada'] = 50 <= longitud <= 2000

        # Validar duración
        validaciones['duracion_objetivo'] = script.achieves_target_duration()

        # Validar segmentos
        validaciones['tiene_segmentos'] = len(script.segments) > 0
        validaciones['tiene_hook'] = any(
            s.type == SegmentType.HOOK for s in script.segments)
        validaciones['tiene_cta'] = any(
            s.type == SegmentType.CTA for s in script.segments)

        # Calcular densidad de palabras clave
        total_palabras = len(script.enhanced_text.split())
        if total_palabras > 0:
            validaciones['densidad_palabras_clave'] = len(
                script.keywords) / total_palabras

        # Calcular score de calidad (0-100)
        score = 0
        if validaciones['longitud_adecuada']:
            score += 20
        if validaciones['duracion_objetivo']:
            score += 25
        if validaciones['tiene_segmentos']:
            score += 15
        if validaciones['tiene_hook']:
            score += 20
        if validaciones['tiene_cta']:
            score += 20

        validaciones['score_calidad'] = score

        return validaciones

    @staticmethod
    def sugerir_mejoras(script: Script) -> List[str]:
        """Sugiere mejoras para el script."""
        mejoras = []
        validacion = ScriptDomainService.validar_calidad_script(script)

        if not validacion['longitud_adecuada']:
            if len(script.enhanced_text) < 50:
                mejoras.append(
                    "El script es muy corto. Considera añadir más detalles o contexto.")
            else:
                mejoras.append(
                    "El script es muy largo. Considera resumir el contenido principal.")

        if not validacion['duracion_objetivo']:
            duracion = script.estimated_duration
            objetivo = script.target_duration
            if duracion > objetivo:
                mejoras.append(
                    f"El script durará ~{duracion:.1f}s, excede el objetivo de {objetivo}s.")
            else:
                mejoras.append(
                    f"El script durará ~{duracion:.1f}s, es más corto que el objetivo de {objetivo}s.")

        if not validacion['tiene_hook']:
            mejoras.append(
                "Considera añadir un hook más fuerte al inicio para captar la atención.")

        if not validacion['tiene_cta']:
            mejoras.append(
                "Añade un call-to-action claro al final del script.")

        if len(script.keywords) < 3:
            mejoras.append(
                "Incluye más palabras clave relevantes para mejorar el SEO.")

        if validacion['score_calidad'] < 60:
            mejoras.append(
                "El script necesita optimización general para mejorar su efectividad.")

        return mejoras
