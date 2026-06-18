"""Generic async repository with common CRUD operations."""

from typing import Any, Generic, Optional, Type, TypeVar

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Base repository providing async CRUD for any SQLAlchemy model."""

    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 20) -> list[ModelType]:
        """Fetch paginated records."""
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit).order_by(self.model.id.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: dict[str, Any]) -> ModelType:
        """Insert a new record."""
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: int, data: dict[str, Any]) -> Optional[ModelType]:
        """Update a record by primary key."""
        filtered = {k: v for k, v in data.items() if v is not None}
        if not filtered:
            return await self.get_by_id(id)
        await self.session.execute(
            update(self.model).where(self.model.id == id).values(**filtered)
        )
        await self.session.commit()
        return await self.get_by_id(id)

    async def soft_delete(self, id: int) -> bool:
        """Mark a record as deleted without removing it."""
        from datetime import datetime, timezone

        obj = await self.get_by_id(id)
        if not obj:
            return False
        obj.is_deleted = True
        obj.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
        return True

    async def count(self, **filters: Any) -> int:
        """Count records with optional filters."""
        stmt = select(func.count()).select_from(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                stmt = stmt.where(getattr(self.model, key) == value)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def exists(self, id: int) -> bool:
        """Check if a record exists by primary key."""
        result = await self.session.execute(
            select(func.count()).select_from(self.model).where(self.model.id == id)
        )
        return result.scalar_one() > 0
