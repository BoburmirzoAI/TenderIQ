"""Redis cache wrapper service."""

import json
import logging
from typing import Any, Optional

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Async Redis cache operations."""

    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None

    async def _get_client(self) -> redis.Redis:
        """Lazily initialize and return Redis client."""
        if self._redis is None:
            self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis

    async def get(self, key: str) -> Optional[str]:
        """Get a value from cache."""
        client = await self._get_client()
        return await client.get(key)

    async def get_json(self, key: str) -> Optional[Any]:
        """Get and deserialize a JSON value from cache."""
        value = await self.get(key)
        if value is None:
            return None
        return json.loads(value)

    async def set(self, key: str, value: str, expire: int = 3600) -> None:
        """Set a value in cache with TTL in seconds."""
        client = await self._get_client()
        await client.set(key, value, ex=expire)

    async def set_json(self, key: str, value: Any, expire: int = 3600) -> None:
        """Serialize and set a JSON value in cache."""
        await self.set(key, json.dumps(value, default=str), expire)

    async def delete(self, key: str) -> None:
        """Delete a key from cache."""
        client = await self._get_client()
        await client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        client = await self._get_client()
        return bool(await client.exists(key))

    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter and return the new value."""
        client = await self._get_client()
        return await client.incrby(key, amount)

    async def expire(self, key: str, seconds: int) -> None:
        """Set TTL on an existing key."""
        client = await self._get_client()
        await client.expire(key, seconds)

    async def close(self) -> None:
        """Close the Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


cache_service = CacheService()
