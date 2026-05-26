from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv

from app.models import get_user, verify_password

load_dotenv()


class AuthService:
    _SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
    _ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    _bearer_scheme = HTTPBearer()

    @staticmethod
    def authenticate_user(username: str, password: str):
        user = get_user(username)
        if not user:
            return None
        if not verify_password(password, user["hashed_password"]):
            return None
        if user.get("disabled"):
            return None
        return user

    @classmethod
    def create_access_token(cls, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, cls._SECRET_KEY, algorithm=cls._ALGORITHM)

    @classmethod
    def _decode_token(cls, token: str) -> dict:
        try:
            return jwt.decode(token, cls._SECRET_KEY, algorithms=[cls._ALGORITHM])
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak valid atau sudah kedaluwarsa.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @classmethod
    def get_current_user(
        cls,
        credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    ):
        payload = cls._decode_token(credentials.credentials)
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak valid.",
            )
        user = get_user(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Pengguna tidak ditemukan.",
            )
        return user

    @classmethod
    def require_role(cls, *roles: str):
        def _check(current_user: dict = Depends(cls.get_current_user)):
            if current_user["role"] not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Akses ditolak. Diperlukan peran: {', '.join(roles)}.",
                )
            return current_user
        return _check


# Ekspor alias untuk memastikan kompatibilitas hardcoded di file lain
authenticate_user = AuthService.authenticate_user
create_access_token = AuthService.create_access_token
get_current_user = AuthService.get_current_user
require_role = AuthService.require_role
ACCESS_TOKEN_EXPIRE_MINUTES = AuthService.ACCESS_TOKEN_EXPIRE_MINUTES
