from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: Optional[bool] = False


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
    foto_profile: Optional[str] = None
    cv_path: Optional[str] = None
    transkrip_path: Optional[str] = None
    jumlah_lamaran: Optional[int] = None


class LowonganCreate(BaseModel):
    perusahaan: str
    posisi: str
    lokasi: str
    deskripsi: str
    tanggal_tutup: str
    status_aktif: bool = True
    banner_path: Optional[str] = None
    persyaratan: Optional[str] = None
    benefit: Optional[str] = None


class LowonganUpdate(BaseModel):
    perusahaan: str
    posisi: str
    lokasi: str
    deskripsi: str
    tanggal_tutup: str
    status_aktif: bool
    banner_path: Optional[str] = None
    persyaratan: Optional[str] = None
    benefit: Optional[str] = None


class PengumumanCreate(BaseModel):
    judul: str
    isi: str

class PengumumanUpdate(BaseModel):
    judul: str
    isi: str


class LamaranCreate(BaseModel):
    id_lowongan: int
    posisi: str


class LamaranStatusUpdate(BaseModel):
    status_lamaran: str


class UserDosenUpdate(BaseModel):
    dosen_pembimbing: Optional[str] = None

class PesanCreate(BaseModel):
    receiver_username: str
    pesan: str = ""
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_name: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
