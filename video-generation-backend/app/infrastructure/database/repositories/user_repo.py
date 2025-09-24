"""
Concrete implementation of User Repository
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func, or_

from app.domain.repositories.user_repository import UserRepository
from app.domain.entities.user import Usuario, TipoSuscripcion, EstadoUsuario
from ..models import UsuarioDB, TipoSuscripcionDB, EstadoUsuarioDB


class SQLUserRepository(UserRepository):
    """Implementación concreta del repositorio de usuarios usando SQLAlchemy."""

    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, db_user: UsuarioDB) -> Usuario:
        """Convierte un modelo de BD a entidad de dominio."""
        return Usuario(
            id=db_user.id,
            email=db_user.email,
            nombre=db_user.nombre,
            avatar_url=db_user.avatar_url,
            tipo_suscripcion=TipoSuscripcion(db_user.tipo_suscripcion.value),
            estado=EstadoUsuario(db_user.estado.value),
            videos_generados_mes_actual=db_user.videos_generados_mes_actual,
            total_videos_generados=db_user.total_videos_generados,
            fecha_registro=db_user.fecha_registro,
            ultima_actividad=db_user.ultima_actividad,
            stripe_customer_id=db_user.stripe_customer_id,
            preferencias=db_user.preferencias or {}
        )

    def _to_db_model(self, user: Usuario) -> UsuarioDB:
        """Convierte una entidad de dominio a modelo de BD."""
        return UsuarioDB(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            avatar_url=user.avatar_url,
            tipo_suscripcion=TipoSuscripcionDB(user.tipo_suscripcion.value),
            estado=EstadoUsuarioDB(user.estado.value),
            videos_generados_mes_actual=user.videos_generados_mes_actual,
            total_videos_generados=user.total_videos_generados,
            fecha_registro=user.fecha_registro,
            ultima_actividad=user.ultima_actividad,
            stripe_customer_id=user.stripe_customer_id,
            preferencias=user.preferencias
        )

    async def create(self, entity: Usuario) -> Usuario:
        """Crea un nuevo usuario."""
        db_user = self._to_db_model(entity)
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return self._to_entity(db_user)

    async def get_by_id(self, id: str) -> Optional[Usuario]:
        """Obtiene un usuario por su ID."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.id == id).first()
        return self._to_entity(db_user) if db_user else None

    async def update(self, entity: Usuario) -> Usuario:
        """Actualiza un usuario existente."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.id == entity.id).first()
        if not db_user:
            raise ValueError(f"User with id {entity.id} not found")

        # Actualizar campos
        db_user.nombre = entity.nombre
        db_user.avatar_url = entity.avatar_url
        db_user.tipo_suscripcion = TipoSuscripcionDB(entity.tipo_suscripcion.value)
        db_user.estado = EstadoUsuarioDB(entity.estado.value)
        db_user.videos_generados_mes_actual = entity.videos_generados_mes_actual
        db_user.total_videos_generados = entity.total_videos_generados
        db_user.ultima_actividad = entity.ultima_actividad
        db_user.stripe_customer_id = entity.stripe_customer_id
        db_user.preferencias = entity.preferencias

        self.session.commit()
        self.session.refresh(db_user)
        return self._to_entity(db_user)

    async def delete(self, id: str) -> bool:
        """Elimina un usuario."""
        result = self.session.query(UsuarioDB).filter(UsuarioDB.id == id).delete()
        self.session.commit()
        return result > 0

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Usuario]:
        """Obtiene todos los usuarios con paginación."""
        db_users = (
            self.session.query(UsuarioDB)
            .order_by(desc(UsuarioDB.fecha_registro))
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [self._to_entity(user) for user in db_users]

    async def count(self, filters: Optional[dict] = None) -> int:
        """Cuenta usuarios con filtros opcionales."""
        query = self.session.query(func.count(UsuarioDB.id))

        if filters:
            if 'estado' in filters:
                query = query.filter(UsuarioDB.estado == filters['estado'])
            if 'tipo_suscripcion' in filters:
                query = query.filter(UsuarioDB.tipo_suscripcion == filters['tipo_suscripcion'])

        return query.scalar()

    async def exists(self, id: str) -> bool:
        """Verifica si existe un usuario."""
        return self.session.query(UsuarioDB.id).filter(UsuarioDB.id == id).first() is not None

    async def get_by_email(self, email: str) -> Optional[Usuario]:
        """Obtiene un usuario por email."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.email == email).first()
        return self._to_entity(db_user) if db_user else None

    async def get_by_supabase_id(self, supabase_id: str) -> Optional[Usuario]:
        """Obtiene un usuario por ID de Supabase."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.id == supabase_id).first()
        return self._to_entity(db_user) if db_user else None

    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[Usuario]:
        """Obtiene un usuario por ID de cliente de Stripe."""
        db_user = self.session.query(UsuarioDB).filter(
            UsuarioDB.stripe_customer_id == stripe_customer_id
        ).first()
        return self._to_entity(db_user) if db_user else None

    async def update_subscription(self, user_id: str, tipo_suscripcion: TipoSuscripcion) -> bool:
        """Actualiza el tipo de suscripción de un usuario."""
        result = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.id == user_id)
            .update({UsuarioDB.tipo_suscripcion: TipoSuscripcionDB(tipo_suscripcion.value)})
        )
        self.session.commit()
        return result > 0

    async def update_usage(self, user_id: str, videos_generados: int) -> bool:
        """Actualiza el contador de uso de un usuario."""
        result = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.id == user_id)
            .update({
                UsuarioDB.videos_generados_mes_actual: videos_generados,
                UsuarioDB.ultima_actividad: datetime.utcnow()
            })
        )
        self.session.commit()
        return result > 0

    async def increment_monthly_usage(self, user_id: str) -> bool:
        """Incrementa el uso mensual de un usuario."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.id == user_id).first()
        if db_user:
            db_user.videos_generados_mes_actual += 1
            db_user.total_videos_generados += 1
            db_user.ultima_actividad = datetime.utcnow()
            self.session.commit()
            return True
        return False

    async def reset_monthly_usage(self, user_ids: List[str]) -> bool:
        """Resetea el uso mensual de usuarios."""
        result = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.id.in_(user_ids))
            .update({UsuarioDB.videos_generados_mes_actual: 0})
        )
        self.session.commit()
        return result > 0

    async def get_users_by_subscription(self, tipo_suscripcion: TipoSuscripcion) -> List[Usuario]:
        """Obtiene usuarios por tipo de suscripción."""
        db_users = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.tipo_suscripcion == TipoSuscripcionDB(tipo_suscripcion.value))
            .all()
        )
        return [self._to_entity(user) for user in db_users]

    async def get_active_users(self, limit: int = 100) -> List[Usuario]:
        """Obtiene usuarios activos."""
        db_users = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.estado == EstadoUsuarioDB.ACTIVO)
            .order_by(desc(UsuarioDB.ultima_actividad))
            .limit(limit)
            .all()
        )
        return [self._to_entity(user) for user in db_users]

    async def get_inactive_users(self, days_inactive: int = 30) -> List[Usuario]:
        """Obtiene usuarios inactivos por X días."""
        fecha_limite = datetime.utcnow() - timedelta(days=days_inactive)
        db_users = (
            self.session.query(UsuarioDB)
            .filter(
                and_(
                    UsuarioDB.estado == EstadoUsuarioDB.ACTIVO,
                    or_(
                        UsuarioDB.ultima_actividad < fecha_limite,
                        UsuarioDB.ultima_actividad.is_(None)
                    )
                )
            )
            .all()
        )
        return [self._to_entity(user) for user in db_users]

    async def update_last_activity(self, user_id: str, timestamp: datetime) -> bool:
        """Actualiza la última actividad de un usuario."""
        result = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.id == user_id)
            .update({UsuarioDB.ultima_actividad: timestamp})
        )
        self.session.commit()
        return result > 0

    async def change_user_status(self, user_id: str, estado: EstadoUsuario) -> bool:
        """Cambia el estado de un usuario."""
        result = (
            self.session.query(UsuarioDB)
            .filter(UsuarioDB.id == user_id)
            .update({UsuarioDB.estado: EstadoUsuarioDB(estado.value)})
        )
        self.session.commit()
        return result > 0

    async def get_user_stats(self, user_id: str) -> dict:
        """Obtiene estadísticas de un usuario."""
        db_user = self.session.query(UsuarioDB).filter(UsuarioDB.id == user_id).first()
        if not db_user:
            return {}

        # Calcular días desde registro
        dias_desde_registro = (datetime.utcnow() - db_user.fecha_registro).days

        # Calcular días desde última actividad
        dias_inactivo = 0
        if db_user.ultima_actividad:
            dias_inactivo = (datetime.utcnow() - db_user.ultima_actividad).days

        return {
            'id': db_user.id,
            'email': db_user.email,
            'tipo_suscripcion': db_user.tipo_suscripcion.value,
            'estado': db_user.estado.value,
            'videos_mes_actual': db_user.videos_generados_mes_actual,
            'total_videos': db_user.total_videos_generados,
            'dias_desde_registro': dias_desde_registro,
            'dias_inactivo': dias_inactivo,
            'limite_mensual': self._get_monthly_limit(db_user.tipo_suscripcion),
            'porcentaje_uso': (db_user.videos_generados_mes_actual / self._get_monthly_limit(db_user.tipo_suscripcion)) * 100
        }

    def _get_monthly_limit(self, tipo_suscripcion: TipoSuscripcionDB) -> int:
        """Obtiene el límite mensual según el tipo de suscripción."""
        limits = {
            TipoSuscripcionDB.GRATUITO: 3,
            TipoSuscripcionDB.BASICO: 10,
            TipoSuscripcionDB.PREMIUM: 50,
            TipoSuscripcionDB.EMPRESARIAL: 200
        }
        return limits.get(tipo_suscripcion, 3)

    async def search_users(self, query: str, limit: int = 50) -> List[Usuario]:
        """Busca usuarios por email o nombre."""
        db_users = (
            self.session.query(UsuarioDB)
            .filter(
                or_(
                    UsuarioDB.email.contains(query),
                    UsuarioDB.nombre.contains(query) if query else False
                )
            )
            .limit(limit)
            .all()
        )
        return [self._to_entity(user) for user in db_users]