from fastapi import FastAPI, HTTPException, Depends, status, APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import timedelta
import os
import shutil
from dotenv import load_dotenv
import sqlite3
import uuid

from app.schemas import LoginRequest, TokenResponse, UserInfo, RegisterRequest, LowonganCreate, LowonganUpdate, LamaranCreate, LamaranStatusUpdate, UserDosenUpdate, PengumumanCreate, PengumumanUpdate, PesanCreate, ForgotPasswordRequest, ResetPasswordRequest
from app.models import get_user, user_repo, Database
from app.storage import LocalS3Storage
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.mailer import mailer_service
from app.cache import cache_manager

load_dotenv()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# S3 Local Storage
s3_storage = LocalS3Storage(bucket_name="agricareer-bucket")


class AuthController:
    def __init__(self):
        self.router = APIRouter(prefix="/auth", tags=["Auth"])
        self.router.add_api_route("/register", self.register, methods=["POST"])
        self.router.add_api_route("/login", self.login, methods=["POST"], response_model=TokenResponse)
        self.router.add_api_route("/me", self.me, methods=["GET"], response_model=UserInfo)
        self.router.add_api_route("/verify-email", self.verify_email, methods=["GET"])
        self.router.add_api_route("/forgot-password", self.forgot_password, methods=["POST"])
        self.router.add_api_route("/reset-password", self.reset_password, methods=["POST"])

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
            "role": "mahasiswa",
            "hashed_password": Database.hash_password(body.password),
            "disabled": False
        }
        
        try:
            user_repo.insert_user(new_user)
            mailer_service.send_verification_email(body.email, body.username, body.full_name)
            return {"message": "Registrasi berhasil. Silakan cek inbox atau folder spam email Anda untuk verifikasi."}
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
        if not user.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email belum diverifikasi. Silakan cek inbox atau folder spam email Anda.",
            )

        expire_minutes = 7 * 24 * 60 if body.remember_me else ACCESS_TOKEN_EXPIRE_MINUTES
        token = create_access_token(
            data={"sub": user["username"], "role": user["role"]},
            expires_delta=timedelta(minutes=expire_minutes),
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

    @staticmethod
    def verify_email(token: str):
        payload = mailer_service.verify_email_token(token)
        if not payload or payload.get("type") != "verify":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token tidak valid atau sudah kedaluwarsa.")
        
        username = payload.get("sub")
        user = get_user(username)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pengguna tidak ditemukan.")
        if user.get("is_verified"):
            return {"message": "Email sudah diverifikasi sebelumnya."}
        
        user_repo.update_is_verified(username, True)
        return {"message": "Email berhasil diverifikasi. Silakan login."}

    @staticmethod
    def forgot_password(body: ForgotPasswordRequest):
        user = user_repo.get_user_by_email(body.email)
        if not user:
            # Tetap berikan respons sukses demi alasan keamanan (mencegah enumerasi email)
            return {"message": "Jika email terdaftar, tautan reset password telah dikirim."}
        
        mailer_service.send_reset_password_email(user["email"], user["username"], user["full_name"])
        return {"message": "Jika email terdaftar, tautan reset password telah dikirim."}

    @staticmethod
    def reset_password(body: ResetPasswordRequest):
        payload = mailer_service.verify_email_token(body.token)
        if not payload or payload.get("type") != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token tidak valid atau sudah kedaluwarsa.")
        
        username = payload.get("sub")
        user = get_user(username)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pengguna tidak ditemukan.")
        
        new_hashed_password = Database.hash_password(body.new_password)
        user_repo.update_password(username, new_hashed_password)
        return {"message": "Password berhasil diubah. Silakan login dengan password baru."}


class LowonganController:
    def __init__(self):
        self.router = APIRouter(prefix="/lowongan", tags=["Lowongan"])
        self.router.add_api_route("/", self.get_lowongan, methods=["GET"])
        self.router.add_api_route("/", self.create_lowongan, methods=["POST"])
        self.router.add_api_route("/upload-banner", self.upload_banner, methods=["POST"])
        self.router.add_api_route("/{id}", self.update_lowongan, methods=["PUT"])

    @staticmethod
    def get_lowongan(limit: int = None, offset: int = None, user: dict = Depends(get_current_user)):
        cache_key = f"lowongan_{limit}_{offset}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        data = user_repo.get_all_lowongan(limit=limit, offset=offset)
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    def create_lowongan(body: LowonganCreate, user: dict = Depends(require_role("admin"))):
        new_id = user_repo.insert_lowongan(body.dict())
        cache_manager.delete_cache("lowongan_*")
        return {"message": "Lowongan berhasil ditambahkan.", "id": new_id}

    @staticmethod
    def update_lowongan(id: int, body: LowonganUpdate, user: dict = Depends(require_role("admin"))):
        existing = user_repo.get_lowongan_by_id(id)
        if not existing:
            raise HTTPException(status_code=404, detail="Lowongan tidak ditemukan.")
        user_repo.update_lowongan(id, body.dict())
        cache_manager.delete_cache("lowongan_*")
        return {"message": "Lowongan berhasil diperbarui."}

    @staticmethod
    async def upload_banner(file: UploadFile = File(...), user: dict = Depends(require_role("admin"))):
        file.file.seek(0, 2)
        if file.file.tell() > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50MB.")
        file.file.seek(0)

        import os
        import uuid
        from .storage import s3_storage
        
        ext = os.path.splitext(file.filename)[1]
        if not ext:
            ext = ".jpg"
            
        file_hash = f"{uuid.uuid4().hex}{ext}"
        
        # Simpan menggunakan S3 local storage
        s3_storage.put_object(file.file, file_hash)
        public_url = s3_storage.get_url(file_hash)
        
        # Insert file lookup for authorization 
        user_repo.insert_file_lookup(file_hash, user["username"], "banner")
        
        return {"message": "Banner berhasil diunggah", "url": public_url}


class PengumumanController:
    def __init__(self):
        self.router = APIRouter(prefix="/pengumuman", tags=["Pengumuman"])
        self.router.add_api_route("/", self.get_pengumuman, methods=["GET"])
        self.router.add_api_route("/", self.create_pengumuman, methods=["POST"])
        self.router.add_api_route("/{id}", self.update_pengumuman, methods=["PUT"])
        self.router.add_api_route("/{id}", self.delete_pengumuman, methods=["DELETE"])

    @staticmethod
    def get_pengumuman(user: dict = Depends(get_current_user)):
        cache_key = "pengumuman_all"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        data = user_repo.get_all_pengumuman()
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    def create_pengumuman(body: PengumumanCreate, user: dict = Depends(require_role("admin"))):
        from datetime import datetime
        data = body.dict()
        data["tanggal_dibuat"] = datetime.now().strftime("%Y-%m-%d")
        data["penulis"] = user["full_name"]
        pengumuman_id = user_repo.insert_pengumuman(data)
        cache_manager.delete_cache("pengumuman_*")
        return {"id": pengumuman_id, "message": "Pengumuman berhasil ditambahkan."}

    @staticmethod
    def update_pengumuman(id: int, body: PengumumanUpdate, user: dict = Depends(require_role("admin"))):
        user_repo.update_pengumuman(id, body.dict())
        cache_manager.delete_cache("pengumuman_*")
        return {"message": "Pengumuman berhasil diperbarui."}

    @staticmethod
    def delete_pengumuman(id: int, user: dict = Depends(require_role("admin"))):
        user_repo.delete_pengumuman(id)
        cache_manager.delete_cache("pengumuman_*")
        return {"message": "Pengumuman berhasil dihapus."}


class LamaranController:
    def __init__(self):
        self.router = APIRouter(prefix="/lamaran", tags=["Lamaran"])
        self.router.add_api_route("/", self.get_lamaran, methods=["GET"])
        self.router.add_api_route("/", self.create_lamaran, methods=["POST"])
        self.router.add_api_route("/all", self.get_all_lamaran, methods=["GET"])
        self.router.add_api_route("/{id}/status", self.update_lamaran_status, methods=["PUT"])
        self.router.add_api_route("/{id}", self.get_lamaran_by_id, methods=["GET"])
        self.router.add_api_route("/{id}/upload-bukti", self.upload_bukti_penerimaan, methods=["POST"])

    @staticmethod
    def get_all_lamaran(user: dict = Depends(get_current_user)):
        cache_key = f"lamaran_all_{user['username']}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        if user["role"] == "admin":
            data = user_repo.get_all_lamaran()
        elif user["role"] == "dosen":
            data = user_repo.get_lamaran_by_dosen(user["username"])
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akses ditolak.")
            
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    async def update_lamaran_status(id: int, body: LamaranStatusUpdate, user: dict = Depends(require_role("dosen"))):
        existing = user_repo.get_lamaran_by_id(id)
        if not existing:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan.")
        user_repo.update_lamaran_status(id, body.status_lamaran)

        # Kirim notifikasi ke mahasiswa
        mahasiswa_username = existing.get("username_mahasiswa")
        perusahaan = existing.get("perusahaan")
        if mahasiswa_username:
            cache_manager.delete_cache(f"lamaran_all_{user['username']}")
            cache_manager.delete_cache(f"lamaran_all_{mahasiswa_username}")
            cache_manager.delete_cache(f"notifikasi_{mahasiswa_username}")
            cache_manager.delete_cache("lamaran_all_admin")
            if body.status_lamaran == "Seleksi Perusahaan":
                user_repo.insert_notifikasi({
                    "username_penerima": mahasiswa_username,
                    "judul": "Status Administrasi Lamaran",
                    "pesan": f"Administrasi lamaran Anda di {perusahaan} telah disetujui oleh Dosen Pembimbing.",
                    "link_path": f"/mahasiswa/lamaran/detail/{id}"
                })
                await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, mahasiswa_username)
            elif body.status_lamaran == "Diterima":
                user_repo.insert_notifikasi({
                    "username_penerima": mahasiswa_username,
                    "judul": "Keputusan Final Lamaran",
                    "pesan": f"Bukti keputusan lamaran Anda di {perusahaan} telah divalidasi dan dinyatakan DITERIMA.",
                    "link_path": f"/mahasiswa/lamaran/detail/{id}"
                })
                await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, mahasiswa_username)
            elif body.status_lamaran == "Ditolak":
                if not existing.get("bukti_penerimaan_path"):
                    user_repo.insert_notifikasi({
                        "username_penerima": mahasiswa_username,
                        "judul": "Status Administrasi Lamaran",
                        "pesan": f"Administrasi lamaran Anda di {perusahaan} ditolak oleh Dosen Pembimbing.",
                        "link_path": f"/mahasiswa/lamaran/detail/{id}"
                    })
                else:
                    user_repo.insert_notifikasi({
                        "username_penerima": mahasiswa_username,
                        "judul": "Keputusan Final Lamaran",
                        "pesan": f"Bukti keputusan lamaran Anda di {perusahaan} ditolak. Silakan periksa kembali.",
                        "link_path": f"/mahasiswa/lamaran/detail/{id}"
                    })
                await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, mahasiswa_username)

        return {"message": f"Status lamaran diperbarui menjadi {body.status_lamaran}."}

    @staticmethod
    async def upload_bukti_penerimaan(id: int, file: UploadFile = File(...), user: dict = Depends(require_role("mahasiswa"))):
        file.file.seek(0, 2)
        if file.file.tell() > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50MB.")
        file.file.seek(0)

        import os
        import uuid
        
        # Pastikan lamaran milik mahasiswa ini
        existing = user_repo.get_lamaran_by_id(id, user["username"])
        if not existing:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan atau Anda tidak memiliki akses.")
            
        ext = os.path.splitext(file.filename)[1]
        if not ext:
            ext = ".pdf"
            
        file_hash = f"{uuid.uuid4().hex}{ext}"
        
        # Simpan menggunakan S3
        s3_storage.put_object(file.file, file_hash)
        
        # Insert file lookup for authorization
        user_repo.insert_file_lookup(file_hash, user["username"], "bukti")
        
        # Update database lamaran
        path = s3_storage.get_url(file_hash)
        user_repo.update_lamaran_bukti(id, path)
        user_repo.update_lamaran_status(id, "Menunggu Validasi Akhir")

        # Kirim notifikasi ke dosen pembimbing
        student = user_repo.get_user(user["username"])
        dosen_username = student.get("dosen_pembimbing")
        if dosen_username:
            perusahaan = existing.get("perusahaan") if existing else "Perusahaan"
            user_repo.insert_notifikasi({
                "username_penerima": dosen_username,
                "judul": "Validasi Bukti Penerimaan",
                "pesan": f"{student.get('full_name')} ({student.get('nim')}) telah mengunggah bukti keputusan untuk lamaran di {perusahaan}. Silakan lakukan validasi akhir.",
                "link_path": "/dosen/lamaran"
            })
            await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, dosen_username)
            cache_manager.delete_cache(f"notifikasi_{dosen_username}")
            cache_manager.delete_cache(f"lamaran_all_{dosen_username}")
            
        cache_manager.delete_cache(f"lamaran_all_{user['username']}")
        cache_manager.delete_cache("lamaran_all_admin")
        
        return {"message": "Bukti keputusan berhasil diunggah", "path": path}


    @staticmethod
    def get_lamaran(user: dict = Depends(require_role("mahasiswa"))):
        cache_key = f"lamaran_all_{user['username']}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        data = user_repo.get_lamaran_by_mahasiswa(user["username"])
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    def get_lamaran_by_id(id: int, current_user: dict = Depends(get_current_user)):
        username = current_user["username"] if current_user["role"] == "mahasiswa" else None
        result = user_repo.get_lamaran_by_id(id, username)
        if not result:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan atau Anda tidak memiliki akses.")
        return result

    @staticmethod
    async def create_lamaran(body: LamaranCreate, current_user: dict = Depends(require_role("mahasiswa"))):
        # 1. Pastikan mahasiswa sudah upload CV
        user_info = get_user(current_user["username"])
        if not user_info.get("cv_path"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda harus mengunggah CV terlebih dahulu sebelum melamar."
            )

        # 2. Cek apakah sudah melamar di lowongan & posisi ini
        if user_repo.check_existing_lamaran(body.id_lowongan, current_user["username"], body.posisi):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda sudah melamar untuk posisi ini pada lowongan ini."
            )

        # 3. Insert data lamaran
        lamaran_data = {
            "id_lowongan": body.id_lowongan,
            "username_mahasiswa": current_user["username"],
            "posisi": body.posisi
        }
        lamaran_id = user_repo.insert_lamaran(lamaran_data)

        # 4. Kirim notifikasi ke dosen pembimbing
        dosen_username = user_info.get("dosen_pembimbing")
        if dosen_username:
            lowongan = user_repo.get_lowongan_by_id(body.id_lowongan)
            perusahaan = lowongan.get("perusahaan") if lowongan else "Perusahaan"
            user_repo.insert_notifikasi({
                "username_penerima": dosen_username,
                "judul": "Validasi Administrasi Baru",
                "pesan": f"{user_info.get('full_name')} ({user_info.get('nim')}) telah mengajukan lamaran baru di {perusahaan} untuk posisi {body.posisi}. Silakan lakukan validasi administrasi.",
                "link_path": "/dosen/lamaran"
            })
            await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, dosen_username)
            cache_manager.delete_cache(f"notifikasi_{dosen_username}")
            cache_manager.delete_cache(f"lamaran_all_{dosen_username}")

        cache_manager.delete_cache(f"lamaran_all_{current_user['username']}")
        cache_manager.delete_cache(f"profile_{current_user['username']}")
        cache_manager.delete_cache("lamaran_all_admin")

        return {"message": "Lamaran berhasil dikirim.", "id": lamaran_id}


class UsersController:
    def __init__(self):
        self.router = APIRouter(prefix="/users", tags=["Users"])
        self.router.add_api_route("/", self.get_users, methods=["GET"])
        self.router.add_api_route("/{username}/role", self.update_role, methods=["PUT"])
        self.router.add_api_route("/{username}/dosen", self.update_dosen, methods=["PUT"])

    @staticmethod
    def get_users(user: dict = Depends(require_role("admin"))):
        return user_repo.get_all_users()

    @staticmethod
    def update_dosen(username: str, body: UserDosenUpdate, user: dict = Depends(require_role("admin"))):
        target_user = user_repo.get_user(username)
        if not target_user:
            raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
        if target_user["role"] != "mahasiswa":
            raise HTTPException(status_code=400, detail="Hanya mahasiswa yang bisa memiliki dosen pembimbing.")
        
        # Verify the target dosen exists if assigning someone
        if body.dosen_pembimbing:
            dosen = user_repo.get_user(body.dosen_pembimbing)
            if not dosen or dosen["role"] != "dosen":
                raise HTTPException(status_code=400, detail="Dosen pembimbing tidak valid.")
                
        user_repo.update_user_dosen(username, body.dosen_pembimbing)
        return {"message": "Dosen pembimbing berhasil diperbarui."}

    @staticmethod
    def update_role(username: str, role_update: dict, user: dict = Depends(require_role("admin"))):
        new_role = role_update.get("role")
        if new_role not in ["dosen", "mahasiswa"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Peran tidak valid atau tidak diizinkan. Hanya dapat mengubah menjadi dosen atau mahasiswa."
            )
        
        target_user = user_repo.get_user(username)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pengguna tidak ditemukan."
            )
            
        if target_user["role"] == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tidak dapat mengubah peran admin."
            )

        user_repo.update_user_role(username, new_role)
        return {"message": f"Peran {username} berhasil diperbarui menjadi {new_role}."}


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


class ProfileController:
    def __init__(self):
        self.router = APIRouter(prefix="/profile", tags=["Profile"])
        self.router.add_api_route("/me", self.get_profile, methods=["GET"], response_model=UserInfo)
        self.router.add_api_route("/upload/{file_type}", self.upload_file, methods=["POST"])
        self.router.add_api_route("/upload/{file_type}", self.delete_file, methods=["DELETE"])

    @staticmethod
    def get_profile(current_user: dict = Depends(get_current_user)):
        username = current_user["username"]
        cache_key = f"profile_{username}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        user = get_user(username)
        jumlah_lamaran = 0
        if user["role"] == "mahasiswa":
            lamaran = user_repo.get_lamaran_by_mahasiswa(username)
            jumlah_lamaran = len(lamaran)
            
        data = UserInfo(
            username=user["username"],
            full_name=user["full_name"],
            role=user["role"],
            email=user.get("email"),
            nim=user.get("nim"),
            nip=user.get("nip"),
            foto_profile=user.get("foto_profile"),
            cv_path=user.get("cv_path"),
            transkrip_path=user.get("transkrip_path"),
            jumlah_lamaran=jumlah_lamaran
        ).dict()
        
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    async def upload_file(file_type: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
        if file_type not in ["foto_profile", "cv_path", "transkrip_path"]:
            raise HTTPException(status_code=400, detail="Tipe file tidak valid")
            
        file.file.seek(0, 2)
        if file.file.tell() > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50MB.")
        file.file.seek(0)
            
        user = get_user(current_user["username"])
        old_url = user.get(file_type)
        if old_url:
            old_filename = old_url.split('/')[-1]
            s3_storage.delete_object(old_filename)
            user_repo.delete_file_lookup(old_filename)

        ext = os.path.splitext(file.filename)[1]
        if not ext:
            ext = ".png" if file_type == "foto_profile" else ".pdf"
            
        file_hash = f"{uuid.uuid4().hex}{ext}"
        
        # Simpan menggunakan S3 local storage
        if file_type == "foto_profile":
            try:
                # pyrefly: ignore [missing-import]
                from PIL import Image
                import io
                
                img = Image.open(file.file)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                base_width = 500
                w, h = img.size
                if w > base_width:
                    w_percent = (base_width / float(w))
                    h_size = int((float(h) * float(w_percent)))
                    img = img.resize((base_width, h_size), Image.Resampling.LANCZOS)
                
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85)
                buffer.seek(0)
                
                ext = ".jpg"
                file_hash = f"{uuid.uuid4().hex}{ext}"
                
                s3_storage.put_object(buffer, file_hash)
            except ImportError:
                print("Warning: Pillow (PIL) tidak terinstall. Foto disimpan tanpa kompresi.")
                file.file.seek(0)
                s3_storage.put_object(file.file, file_hash)
            except Exception as e:
                print(f"Error kompresi gambar: {e}. Fallback ke file asli.")
                file.file.seek(0)
                s3_storage.put_object(file.file, file_hash)
        else:
            s3_storage.put_object(file.file, file_hash)
        public_url = s3_storage.get_url(file_hash)
        
        user_repo.insert_file_lookup(file_hash, current_user["username"], file_type)
        user_repo.update_user_file(current_user["username"], file_type, public_url)
        cache_manager.delete_cache(f"profile_{current_user['username']}")
        return {"message": "File berhasil diunggah", "url": public_url}

    @staticmethod
    def delete_file(file_type: str, current_user: dict = Depends(get_current_user)):
        if file_type not in ["foto_profile", "cv_path", "transkrip_path"]:
            raise HTTPException(status_code=400, detail="Tipe file tidak valid")
            
        user = get_user(current_user["username"])
        old_url = user.get(file_type)
        if not old_url:
            raise HTTPException(status_code=404, detail="File tidak ditemukan")
            
        old_filename = old_url.split('/')[-1]
        s3_storage.delete_object(old_filename)
        user_repo.delete_file_lookup(old_filename)
        
        user_repo.update_user_file(current_user["username"], file_type, None)
        cache_manager.delete_cache(f"profile_{current_user['username']}")
        return {"message": "File berhasil dihapus"}


class FileController:
    def __init__(self):
        self.router = APIRouter(tags=["Files"])
        self.router.add_api_route("/uploads/{bucket_name}/{filename}", self.get_file, methods=["GET"])

    @staticmethod
    def get_file(bucket_name: str, filename: str, current_user: dict = Depends(get_current_user)):
        # 1. Pastikan file ada di lookup table
        file_info = user_repo.get_file_lookup(filename)
        if not file_info:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File tidak ditemukan atau telah dihapus")

        # 2. Otorisasi: Mahasiswa hanya boleh melihat filenya sendiri, kecuali foto profil dan banner
        if file_info.get("file_type") not in ["foto_profile", "banner"]:
            if current_user["role"] == "mahasiswa":
                if current_user['username'] != file_info["username"]:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akses ditolak")
                
        local_s3_dir = os.path.join(os.path.dirname(__file__), "..", "local_s3")
        file_path = os.path.join(local_s3_dir, bucket_name, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File fisik tidak ditemukan")
            
        return FileResponse(
            file_path,
            headers={
                "Cache-Control": "public, max-age=604800, must-revalidate"
            }
        )

class ConnectionManager:
    def __init__(self):
        self.active_connections = {} # dict of username -> WebSocket

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]

    async def send_personal_message(self, message: dict, username: str):
        if username in self.active_connections:
            await self.active_connections[username].send_json(message)

manager = ConnectionManager()

class ChatController:
    def __init__(self):
        self.router = APIRouter(prefix="/chat", tags=["Chat"])
        self.router.add_api_route("/contacts", self.get_contacts, methods=["GET"])
        self.router.add_api_route("/unread", self.get_unread, methods=["GET"])
        self.router.add_api_route("/history/{partner_username}", self.get_history, methods=["GET"])
        self.router.add_api_route("/mark-read/{partner_username}", self.mark_read, methods=["POST"])
        self.router.add_api_route("/send", self.send_message, methods=["POST"])
        
        @self.router.websocket("/ws/{username}")
        async def websocket_endpoint(websocket: WebSocket, username: str):
            await manager.connect(websocket, username)
            try:
                while True:
                    data = await websocket.receive_text()
                    try:
                        import json
                        payload = json.loads(data)
                        if payload.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except:
                        pass
            except WebSocketDisconnect:
                manager.disconnect(username)

    @staticmethod
    def get_contacts(user: dict = Depends(get_current_user)):
        if user["role"] == "dosen":
            return user_repo.get_contacts_dosen(user["username"])
        elif user["role"] == "mahasiswa":
            db_user = get_user(user["username"])
            return user_repo.get_contacts_mahasiswa(db_user.get("dosen_pembimbing"), user["username"])
        return []
        
    @staticmethod
    def get_unread(user: dict = Depends(get_current_user)):
        cache_key = f"chat_unread_{user['username']}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        count = user_repo.get_unread_count(user["username"])
        data = {"unread": count}
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    def get_history(partner_username: str, limit: int = 10, offset: int = 0, user: dict = Depends(get_current_user)):
        if not partner_username.startswith('GROUP_'):
            user_repo.mark_chat_read(sender=partner_username, receiver=user["username"])
            cache_manager.delete_cache(f"chat_unread_{user['username']}")
        return user_repo.get_chat_history(user["username"], partner_username, limit=limit, offset=offset)

    @staticmethod
    def mark_read(partner_username: str, user: dict = Depends(get_current_user)):
        if not partner_username.startswith('GROUP_'):
            user_repo.mark_chat_read(sender=partner_username, receiver=user["username"])
            cache_manager.delete_cache(f"chat_unread_{user['username']}")
        return {"message": "Telah dibaca"}

    @staticmethod
    async def send_message(body: PesanCreate, user: dict = Depends(get_current_user)):
        from datetime import datetime
        data = {
            "sender_username": user["username"],
            "receiver_username": body.receiver_username,
            "pesan": body.pesan,
            "waktu_kirim": datetime.now()
        }
        msg_id = user_repo.insert_pesan(data)
        data["id"] = msg_id
        data["is_read"] = 0
        data["waktu_kirim"] = data["waktu_kirim"].isoformat()
        
        data["sender_full_name"] = user["full_name"]
        data["sender_foto_profile"] = user["foto_profile"]
        data["isNew"] = True
        
        ws_payload = {"type": "chat", "data": data}
        
        if body.receiver_username.startswith('GROUP_'):
            dosen_username = body.receiver_username.replace('GROUP_', '')
            members = user_repo.get_group_members(dosen_username)
            for member in members:
                if member != user["username"]:
                    await manager.send_personal_message(ws_payload, member)
                    cache_manager.delete_cache(f"chat_unread_{member}")
        else:
            await manager.send_personal_message(ws_payload, body.receiver_username)
            cache_manager.delete_cache(f"chat_unread_{body.receiver_username}")
        
        return {"message": "Pesan terkirim", "data": data}


class NotifikasiController:
    def __init__(self):
        self.router = APIRouter(prefix="/notifikasi", tags=["Notifikasi"])
        self.router.add_api_route("/", self.get_notifikasi, methods=["GET"])
        self.router.add_api_route("/read-all", self.mark_all_as_read, methods=["PUT"])
        self.router.add_api_route("/{id}/read", self.mark_as_read, methods=["PUT"])

    @staticmethod
    def get_notifikasi(current_user: dict = Depends(get_current_user)):
        cache_key = f"notifikasi_{current_user['username']}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        data = user_repo.get_notifikasi_by_user(current_user["username"])
        cache_manager.set_cache(cache_key, data, expire_seconds=3600)
        return data

    @staticmethod
    def mark_as_read(id: int, current_user: dict = Depends(get_current_user)):
        user_repo.mark_notifikasi_as_read(id, current_user["username"])
        cache_manager.delete_cache(f"notifikasi_{current_user['username']}")
        return {"message": "Notifikasi berhasil ditandai sebagai dibaca."}

    @staticmethod
    def mark_all_as_read(current_user: dict = Depends(get_current_user)):
        user_repo.mark_all_notifikasi_as_read(current_user["username"])
        cache_manager.delete_cache(f"notifikasi_{current_user['username']}")
        return {"message": "Semua notifikasi berhasil ditandai sebagai dibaca."}


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
        self.app.add_middleware(GZipMiddleware, minimum_size=1000)

    def _register_routes(self):
        self.app.include_router(AuthController().router)
        self.app.include_router(LowonganController().router)
        self.app.include_router(LamaranController().router)
        self.app.include_router(PengumumanController().router)
        self.app.include_router(DashboardController().router)
        self.app.include_router(UsersController().router)
        self.app.include_router(HealthController().router)
        self.app.include_router(ProfileController().router)
        self.app.include_router(FileController().router)
        self.app.include_router(ChatController().router)
        self.app.include_router(NotifikasiController().router)

    def get_app(self) -> FastAPI:
        return self.app


server = ApplicationServer()
app = server.get_app()
