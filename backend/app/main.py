from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import os
from dotenv import load_dotenv

from app.schemas import LoginRequest, TokenResponse, UserInfo
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

load_dotenv()

app = FastAPI(
    title="AgriCareer API",
    description="Backend API untuk AgriCareer",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS – allow the Vite dev server
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
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


@app.get("/auth/me", response_model=UserInfo, tags=["Auth"])
def me(current_user: dict = Depends(get_current_user)):
    return UserInfo(
        username=current_user["username"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        email=current_user.get("email"),
        nim=current_user.get("nim"),
        nip=current_user.get("nip"),
    )


# ---------------------------------------------------------------------------
# Protected demo routes
# ---------------------------------------------------------------------------
@app.get("/mahasiswa/dashboard", tags=["Mahasiswa"])
def mahasiswa_dashboard(user: dict = Depends(require_role("mahasiswa"))):
    return {
        "message": f"Selamat datang, {user['full_name']}!",
        "role": user["role"],
        "nim": user.get("nim"),
    }


@app.get("/admin/dashboard", tags=["Admin"])
def admin_dashboard(user: dict = Depends(require_role("admin"))):
    return {
        "message": f"Selamat datang, {user['full_name']}!",
        "role": user["role"],
    }


@app.get("/dosen/dashboard", tags=["Dosen"])
def dosen_dashboard(user: dict = Depends(require_role("dosen"))):
    return {
        "message": f"Selamat datang, {user['full_name']}!",
        "role": user["role"],
        "nip": user.get("nip"),
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}
