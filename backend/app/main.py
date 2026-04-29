from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import os
from dotenv import load_dotenv
import sqlite3

from app.schemas import LoginRequest, TokenResponse, UserInfo, RegisterRequest
from app.models import get_user, user_repo, Database
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

load_dotenv()


class AuthController:
    def __init__(self):
        self.router = APIRouter(prefix="/auth", tags=["Auth"])
        self.router.add_api_route("/register", self.register, methods=["POST"])
        self.router.add_api_route("/login", self.login, methods=["POST"], response_model=TokenResponse)
        self.router.add_api_route("/me", self.me, methods=["GET"], response_model=UserInfo)

    @staticmethod
    def register(body: RegisterRequest):
        existing_user = get_user(body.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username sudah terdaftar."
            )

        new_user = {
            "username": body.username,
            "full_name": body.full_name,
            "email": body.email,
            "nim": body.nim,
            "nip": body.nip,
            "role": body.role,
            "hashed_password": Database.hash_password(body.password),
            "disabled": False
        }
        
        try:
            user_repo.insert_user(new_user)
            return {"message": "Registrasi berhasil. Silakan login."}
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email sudah terdaftar atau terjadi kesalahan data."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Terjadi kesalahan: {str(e)}"
            )

    @staticmethod
    def login(body: LoginRequest):
        user = authenticate_user(body.username, body.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username atau password salah.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = create_access_token(
            data={"sub": user["username"], "role": user["role"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            role=user["role"],
            full_name=user["full_name"],
        )

    @staticmethod
    def me(current_user: dict = Depends(get_current_user)):
        return UserInfo(
            username=current_user["username"],
            full_name=current_user["full_name"],
            role=current_user["role"],
            email=current_user.get("email"),
            nim=current_user.get("nim"),
            nip=current_user.get("nip"),
        )


class DashboardController:
    def __init__(self):
        self.router = APIRouter()
        self.router.add_api_route("/mahasiswa/dashboard", self.mahasiswa_dashboard, methods=["GET"], tags=["Mahasiswa"])
        self.router.add_api_route("/admin/dashboard", self.admin_dashboard, methods=["GET"], tags=["Admin"])
        self.router.add_api_route("/dosen/dashboard", self.dosen_dashboard, methods=["GET"], tags=["Dosen"])

    @staticmethod
    def mahasiswa_dashboard(user: dict = Depends(require_role("mahasiswa"))):
        return {
            "message": f"Selamat datang, {user['full_name']}!",
            "role": user["role"],
            "nim": user.get("nim"),
        }

    @staticmethod
    def admin_dashboard(user: dict = Depends(require_role("admin"))):
        return {
            "message": f"Selamat datang, {user['full_name']}!",
            "role": user["role"],
        }

    @staticmethod
    def dosen_dashboard(user: dict = Depends(require_role("dosen"))):
        return {
            "message": f"Selamat datang, {user['full_name']}!",
            "role": user["role"],
            "nip": user.get("nip"),
        }


class HealthController:
    def __init__(self):
        self.router = APIRouter(tags=["System"])
        self.router.add_api_route("/health", self.health, methods=["GET"])

    @staticmethod
    def health():
        return {"status": "ok"}


class ApplicationServer:
    def __init__(self):
        self.app = FastAPI(
            title="Login API",
            description="Backend API untuk Login",
            version="1.0.0",
        )
        self._configure_cors()
        self._register_routes()

    def _configure_cors(self):
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _register_routes(self):
        self.app.include_router(AuthController().router)
        self.app.include_router(DashboardController().router)
        self.app.include_router(HealthController().router)

    def get_app(self) -> FastAPI:
        return self.app


server = ApplicationServer()
app = server.get_app()
