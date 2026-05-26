import os
import json
import redis
from typing import Any, Optional

class CacheManager:
    def __init__(self):
        self._redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis_client = self.__connect()

    def __connect(self) -> Optional[redis.Redis]:
        try:
            client = redis.Redis.from_url(self._redis_url, decode_responses=True)
            client.ping()
            return client
        except Exception as e:
            print(f"Warning: Could not connect to Redis at {self._redis_url}. Caching akan dinonaktifkan secara otomatis (fallback). Error: {e}")
            return None

    def get_cache(self, key: str) -> Optional[Any]:
        if not self._redis_client:
            return None
        try:
            data = self._redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis get error: {e}")
        return None

    def set_cache(self, key: str, value: Any, expire_seconds: int = 3600) -> None:
        if not self._redis_client:
            return
        try:
            self._redis_client.setex(key, expire_seconds, json.dumps(value))
        except Exception as e:
            print(f"Redis set error: {e}")

    def delete_cache(self, pattern: str) -> None:
        if not self._redis_client:
            return
        try:
            keys = self._redis_client.keys(pattern)
            if keys:
                self._redis_client.delete(*keys)
        except Exception as e:
            print(f"Redis delete error: {e}")

cache_manager = CacheManager()
