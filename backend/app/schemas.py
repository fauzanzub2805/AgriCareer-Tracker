from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    email: Optional[str] = None
    nim: Optional[str] = None
    nip: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str


class UserInfo(BaseModel):
    username: str
    full_name: str
    role: str
    email: Optional[str] = None
    nim: Optional[str] = None
    nip: Optional[str] = None


class LowonganCreate(BaseModel):
    perusahaan: str
    posisi: str
    lokasi: str
    deskripsi: str
    tanggal_tutup: str
    status_aktif: bool = True


class LowonganUpdate(BaseModel):
    perusahaan: str
    posisi: str
    lokasi: str
    deskripsi: str
    tanggal_tutup: str
    status_aktif: bool
