"""
Rate limiting middleware
"""
import time
import logging
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware de rate limiting basado en IP y usuario."""

    def __init__(self, app, calls_per_minute: int = None, burst_limit: int = None):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.burst_limit = burst_limit or settings.RATE_LIMIT_BURST
        self.window_size = 60  # 1 minuto en segundos

        # Almacenamiento en memoria para rate limiting
        # En producción, usar Redis para compartir entre instancias
        self.ip_requests: Dict[str, list] = {}
        self.user_requests: Dict[str, list] = {}

    async def dispatch(self, request: Request, call_next):
        """
        Procesa la request y aplica rate limiting.

        Args:
            request: Request de FastAPI
            call_next: Siguiente middleware/handler

        Returns:
            Response: Respuesta del servidor
        """
        # Obtener IP del cliente
        client_ip = self._get_client_ip(request)

        # Obtener ID de usuario si está autenticado
        user_id = await self._get_user_id_from_request(request)

        # Verificar rate limits
        if not self._check_rate_limit(client_ip, user_id):
            return self._create_rate_limit_response()

        # Continuar con la request
        response = await call_next(request)

        # Añadir headers de rate limiting a la respuesta
        self._add_rate_limit_headers(response, client_ip, user_id)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Obtiene la IP del cliente considerando proxies."""
        # Verificar headers de proxy más comunes
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Tomar la primera IP (cliente original)
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # IP directa
        return request.client.host if request.client else "unknown"

    async def _get_user_id_from_request(self, request: Request) -> Optional[str]:
        """Extrae el ID de usuario del token JWT si está presente."""
        try:
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None

            token = auth_header.split(" ")[1]

            # Decodificar token básico para obtener user_id
            # En un escenario real, usarías el mismo servicio de auth
            from app.core.security import security
            payload = security.verify_supabase_token(token)

            if payload:
                return payload.get("sub")  # 'sub' contiene el user_id

            return None

        except Exception as e:
            logger.debug(f"Error extrayendo user_id del token: {str(e)}")
            return None

    def _check_rate_limit(self, client_ip: str, user_id: Optional[str]) -> bool:
        """
        Verifica si la request está dentro de los límites de rate limiting.

        Args:
            client_ip: IP del cliente
            user_id: ID del usuario (si está autenticado)

        Returns:
            bool: True si está dentro del límite, False si se excede
        """
        current_time = time.time()

        # Verificar rate limit por IP
        if not self._check_ip_rate_limit(client_ip, current_time):
            return False

        # Verificar rate limit por usuario (si está autenticado)
        if user_id and not self._check_user_rate_limit(user_id, current_time):
            return False

        # Registrar la request actual
        self._record_request(client_ip, user_id, current_time)

        return True

    def _check_ip_rate_limit(self, client_ip: str, current_time: float) -> bool:
        """Verifica rate limit por IP."""
        if client_ip not in self.ip_requests:
            return True

        # Limpiar requests antiguas
        self.ip_requests[client_ip] = [
            req_time for req_time in self.ip_requests[client_ip]
            if current_time - req_time < self.window_size
        ]

        # Verificar límites
        recent_requests = len(self.ip_requests[client_ip])

        # Verificar burst limit
        if recent_requests >= self.burst_limit:
            logger.warning(f"Burst limit excedido para IP: {client_ip}")
            return False

        # Verificar límite por minuto
        if recent_requests >= self.calls_per_minute:
            logger.warning(f"Rate limit excedido para IP: {client_ip}")
            return False

        return True

    def _check_user_rate_limit(self, user_id: str, current_time: float) -> bool:
        """Verifica rate limit por usuario."""
        if user_id not in self.user_requests:
            return True

        # Limpiar requests antiguas
        self.user_requests[user_id] = [
            req_time for req_time in self.user_requests[user_id]
            if current_time - req_time < self.window_size
        ]

        # Los usuarios autenticados pueden tener límites más altos
        user_limit = self.calls_per_minute * 2  # 2x el límite para usuarios autenticados
        recent_requests = len(self.user_requests[user_id])

        if recent_requests >= user_limit:
            logger.warning(f"User rate limit excedido para usuario: {user_id}")
            return False

        return True

    def _record_request(self, client_ip: str, user_id: Optional[str], current_time: float) -> None:
        """Registra la request actual."""
        # Registrar por IP
        if client_ip not in self.ip_requests:
            self.ip_requests[client_ip] = []
        self.ip_requests[client_ip].append(current_time)

        # Registrar por usuario si está autenticado
        if user_id:
            if user_id not in self.user_requests:
                self.user_requests[user_id] = []
            self.user_requests[user_id].append(current_time)

    def _create_rate_limit_response(self) -> Response:
        """Crea respuesta de rate limit excedido."""
        return Response(
            content='{"error": "Rate limit exceeded", "message": "Demasiadas requests. Intenta de nuevo más tarde."}',
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={
                "Content-Type": "application/json",
                "Retry-After": str(self.window_size),
                "X-Rate-Limit-Limit": str(self.calls_per_minute),
                "X-Rate-Limit-Remaining": "0",
                "X-Rate-Limit-Reset": str(int(time.time() + self.window_size))
            }
        )

    def _add_rate_limit_headers(self, response: Response, client_ip: str, user_id: Optional[str]) -> None:
        """Añade headers de rate limiting a la respuesta."""
        current_time = time.time()

        # Calcular requests restantes para IP
        ip_requests = self.ip_requests.get(client_ip, [])
        ip_remaining = max(0, self.calls_per_minute - len(ip_requests))

        # Calcular tiempo de reset
        reset_time = int(current_time + self.window_size)

        # Añadir headers
        response.headers["X-Rate-Limit-Limit"] = str(self.calls_per_minute)
        response.headers["X-Rate-Limit-Remaining"] = str(ip_remaining)
        response.headers["X-Rate-Limit-Reset"] = str(reset_time)

        # Headers adicionales para usuarios autenticados
        if user_id:
            user_requests = self.user_requests.get(user_id, [])
            user_limit = self.calls_per_minute * 2
            user_remaining = max(0, user_limit - len(user_requests))
            response.headers["X-User-Rate-Limit-Remaining"] = str(user_remaining)

    def cleanup_old_entries(self) -> None:
        """
        Limpia entradas antiguas de memoria (para mantenimiento).
        Debería ejecutarse periódicamente.
        """
        current_time = time.time()

        # Limpiar requests de IP
        for ip in list(self.ip_requests.keys()):
            self.ip_requests[ip] = [
                req_time for req_time in self.ip_requests[ip]
                if current_time - req_time < self.window_size
            ]
            if not self.ip_requests[ip]:
                del self.ip_requests[ip]

        # Limpiar requests de usuario
        for user_id in list(self.user_requests.keys()):
            self.user_requests[user_id] = [
                req_time for req_time in self.user_requests[user_id]
                if current_time - req_time < self.window_size
            ]
            if not self.user_requests[user_id]:
                del self.user_requests[user_id]


def create_rate_limit_middleware(calls_per_minute: int = None, burst_limit: int = None) -> RateLimitMiddleware:
    """
    Factory para crear middleware de rate limiting.

    Args:
        calls_per_minute: Límite de calls por minuto
        burst_limit: Límite de burst

    Returns:
        RateLimitMiddleware: Instancia del middleware
    """
    return lambda app: RateLimitMiddleware(app, calls_per_minute, burst_limit)