from fastapi import FastAPI, HTTPException, Depends, status, APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import timedelta
import os
from dotenv import load_dotenv
import sqlite3
import uuid
import asyncio
import redis.asyncio as redis
import json
from contextlib import asynccontextmanager
from fastapi.concurrency import run_in_threadpool

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
    def register(body: RegisterRequest, background_tasks: BackgroundTasks):
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
            background_tasks.add_task(mailer_service.send_verification_email, body.email, body.username, body.full_name)
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
    def forgot_password(body: ForgotPasswordRequest, background_tasks: BackgroundTasks):
        user = user_repo.get_user_by_email(body.email)
        if not user:
            # Tetap berikan respons sukses demi alasan keamanan (mencegah enumerasi email)
            return {"message": "Jika email terdaftar, tautan reset password telah dikirim."}
        
        background_tasks.add_task(mailer_service.send_reset_password_email, user["email"], user["username"], user["full_name"])
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
        self.router.add_api_route("/stats/summary", self.get_lowongan_stats, methods=["GET"])
        self.router.add_api_route("/{id}", self.update_lowongan, methods=["PUT"])

    @staticmethod
    def get_lowongan(limit: int = None, offset: int = None, user: dict = Depends(get_current_user)):
        cache_key = f"lowongan_{limit}_{offset}"
        cached_data = cache_manager.get_cache(cache_key)
        if cached_data is not None:
            return cached_data
            
        data = user_repo.get_all_lowongan(limit=limit, offset=offset)
        cache_manager.set_cache(cache_key, data, expire_seconds=300)
        return data

    @staticmethod
    def get_lowongan_stats(user: dict = Depends(get_current_user)):
        data = user_repo.get_all_lowongan()
        aktif = sum(1 for l in data if l.get("status_aktif") in [1, True, "1"])
        return {
            "total": len(data), 
            "aktif": aktif,
            "recent": data[:3]
        }

    @staticmethod
    def create_lowongan(body: LowonganCreate, user: dict = Depends(require_role("admin"))):
        new_id = user_repo.insert_lowongan(body.dict())
        return {"message": "Lowongan berhasil ditambahkan.", "id": new_id}

    @staticmethod
    def update_lowongan(id: int, body: LowonganUpdate, user: dict = Depends(require_role("admin"))):
        existing = user_repo.get_lowongan_by_id(id)
        if not existing:
            raise HTTPException(status_code=404, detail="Lowongan tidak ditemukan.")
        user_repo.update_lowongan(id, body.dict())
        return {"message": "Lowongan berhasil diperbarui."}

    @staticmethod
    async def upload_banner(file: UploadFile = File(...), user: dict = Depends(require_role("admin"))):
        try:
            file.file.seek(0, 2)
            if file.file.tell() > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50MB.")
            file.file.seek(0)
            
            file_bytes = await file.read()

            import os
            import uuid
            import io
            
            def _sync_upload():
                ext = os.path.splitext(file.filename)[1]
                if not ext:
                    ext = ".jpg"
                    
                file_hash = f"{uuid.uuid4().hex}{ext}"
                
                # Simpan menggunakan S3 local storage global
                s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
                public_url = s3_storage.get_url(file_hash)
                
                # Insert file lookup for authorization 
                user_repo.insert_file_lookup(file_hash, user["username"], "banner")
                return public_url

            public_url = await run_in_threadpool(_sync_upload)
            
            return {"message": "Banner berhasil diunggah", "url": public_url}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


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
        cache_manager.set_cache(cache_key, data, expire_seconds=60)
        return data

    @staticmethod
    def create_pengumuman(body: PengumumanCreate, user: dict = Depends(require_role("admin"))):
        from datetime import datetime
        data = body.dict()
        data["tanggal_dibuat"] = datetime.now().strftime("%Y-%m-%d")
        data["penulis"] = user["full_name"]
        pengumuman_id = user_repo.insert_pengumuman(data)
        return {"id": pengumuman_id, "message": "Pengumuman berhasil ditambahkan."}

    @staticmethod
    def update_pengumuman(id: int, body: PengumumanUpdate, user: dict = Depends(require_role("admin"))):
        user_repo.update_pengumuman(id, body.dict())
        return {"message": "Pengumuman berhasil diperbarui."}

    @staticmethod
    def delete_pengumuman(id: int, user: dict = Depends(require_role("admin"))):
        user_repo.delete_pengumuman(id)
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
            
        cache_manager.set_cache(cache_key, data, expire_seconds=300)
        return data

    @staticmethod
    async def update_lamaran_status(id: int, body: LamaranStatusUpdate, user: dict = Depends(require_role("dosen"))):
        def _sync_ops():
            existing = user_repo.get_lamaran_by_id(id)
            if not existing:
                return None, None
                
            # Verifikasi bahwa dosen adalah pembimbing dari mahasiswa pelamar
            student = get_user(existing.get("username_mahasiswa"))
            if not student or student.get("dosen_pembimbing") != user["username"]:
                raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan dosen pembimbing mahasiswa ini.")
                
            user_repo.update_lamaran_status(id, body.status_lamaran)

            # Kirim notifikasi ke mahasiswa
            mahasiswa_username = existing.get("username_mahasiswa")
            perusahaan = existing.get("perusahaan")
            if mahasiswa_username:
                cache_manager.delete_cache(f"lamaran_all_{user['username']}")
                cache_manager.delete_cache(f"lamaran_all_{mahasiswa_username}")
                cache_manager.delete_cache(f"notifikasi_{mahasiswa_username}")
                if body.status_lamaran == "Seleksi Perusahaan":
                    user_repo.insert_notifikasi({
                        "username_penerima": mahasiswa_username,
                        "judul": "Status Administrasi Lamaran",
                        "pesan": f"Administrasi lamaran Anda di {perusahaan} telah disetujui oleh Dosen Pembimbing.",
                        "link_path": f"/mahasiswa/lamaran/detail/{id}"
                    })
                elif body.status_lamaran == "Diterima":
                    user_repo.insert_notifikasi({
                        "username_penerima": mahasiswa_username,
                        "judul": "Keputusan Final Lamaran",
                        "pesan": f"Bukti keputusan lamaran Anda di {perusahaan} telah divalidasi dan dinyatakan DITERIMA.",
                        "link_path": f"/mahasiswa/lamaran/detail/{id}"
                    })
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
            return existing, mahasiswa_username

        existing, mahasiswa_username = await run_in_threadpool(_sync_ops)
        if not existing:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan.")

        if mahasiswa_username:
            await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, mahasiswa_username)

        return {"message": f"Status lamaran diperbarui menjadi {body.status_lamaran}."}

    @staticmethod
    async def upload_bukti_penerimaan(id: int, file: UploadFile = File(...), user: dict = Depends(require_role("mahasiswa"))):
        file.file.seek(0, 2)
        if file.file.tell() > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50MB.")
        file.file.seek(0)
        
        file_bytes = await file.read()

        import os
        import uuid
        import io
        
        def _sync_ops():
            # Pastikan lamaran milik mahasiswa ini
            existing = user_repo.get_lamaran_by_id(id, user["username"])
            if not existing:
                return False, None, None
                
            ext = os.path.splitext(file.filename)[1]
            if not ext:
                ext = ".pdf"
                
            file_hash = f"{uuid.uuid4().hex}{ext}"
            
            # Simpan menggunakan S3
            s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
            
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
                cache_manager.delete_cache(f"notifikasi_{dosen_username}")
                cache_manager.delete_cache(f"lamaran_all_{dosen_username}")
                
            cache_manager.delete_cache(f"lamaran_all_{user['username']}")
            
            return True, path, dosen_username

        success, path, dosen_username = await run_in_threadpool(_sync_ops)
        if not success:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan atau Anda tidak memiliki akses.")

        if dosen_username:
            await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, dosen_username)
        
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
        # Mengambil data lamaran (sementara tanpa filter username untuk keperluan verifikasi)
        result = user_repo.get_lamaran_by_id(id)
        if not result:
            raise HTTPException(status_code=404, detail="Lamaran tidak ditemukan.")

        # Verifikasi akses mahasiswa
        if current_user["role"] == "mahasiswa":
            if result.get("username_mahasiswa") != current_user["username"]:
                raise HTTPException(status_code=403, detail="Akses ditolak. Anda hanya bisa melihat lamaran Anda sendiri.")
                
        # Verifikasi akses dosen
        elif current_user["role"] == "dosen":
            student = get_user(result.get("username_mahasiswa"))
            if not student or student.get("dosen_pembimbing") != current_user["username"]:
                raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan dosen pembimbing mahasiswa ini.")
                
        # Admin diizinkan melihat
        elif current_user["role"] == "admin":
            pass
            
        # Blokir role tak dikenal
        else:
            raise HTTPException(status_code=403, detail="Akses ditolak. Peran Anda tidak memiliki izin untuk melihat lamaran ini.")

        return result

    @staticmethod
    async def create_lamaran(body: LamaranCreate, current_user: dict = Depends(require_role("mahasiswa"))):
        def _sync_ops():
            # 1. Pastikan mahasiswa sudah upload CV
            user_info = get_user(current_user["username"])
            if not user_info.get("cv_path"):
                return {"error": "Anda harus mengunggah CV terlebih dahulu sebelum melamar."}

            # 2. Cek apakah sudah melamar di lowongan & posisi ini
            if user_repo.check_existing_lamaran(body.id_lowongan, current_user["username"], body.posisi):
                return {"error": "Anda sudah melamar untuk posisi ini pada lowongan ini."}

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
                cache_manager.delete_cache(f"notifikasi_{dosen_username}")
                cache_manager.delete_cache(f"lamaran_all_{dosen_username}")

            cache_manager.delete_cache(f"lamaran_all_{current_user['username']}")
            cache_manager.delete_cache(f"profile_{current_user['username']}")
            
            return {"lamaran_id": lamaran_id, "dosen_username": dosen_username}
            
        result = await run_in_threadpool(_sync_ops)
        if "error" in result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])

        if result.get("dosen_username"):
            await manager.send_personal_message({"type": "notifikasi", "data": {"message": "New notification"}}, result["dosen_username"])

        return {"message": "Lamaran berhasil dikirim.", "id": result["lamaran_id"]}


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


class SystemController:
    def __init__(self):
        self.router = APIRouter(prefix="/system", tags=["System"])
        self.router.add_api_route("/error-logs", self.get_error_logs, methods=["GET"])

    @staticmethod
    def get_error_logs(limit: int = 50, offset: int = 0, user: dict = Depends(require_role("admin"))):
        return user_repo.get_error_logs(limit=limit, offset=offset)


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
        
        file_bytes = await file.read()

        import io
        import os
        import uuid
            
        def _sync_ops():
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
                    
                    img = Image.open(io.BytesIO(file_bytes))
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
                    s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
                except Exception as e:
                    print(f"Error kompresi gambar: {e}. Fallback ke file asli.")
                    s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
            else:
                s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
                
            public_url = s3_storage.get_url(file_hash)
            
            user_repo.insert_file_lookup(file_hash, current_user["username"], file_type)
            user_repo.update_user_file(current_user["username"], file_type, public_url)
            cache_manager.delete_cache(f"profile_{current_user['username']}")
            return public_url
            
        public_url = await run_in_threadpool(_sync_ops)
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
    def get_file(bucket_name: str, filename: str, request: Request, token: str = None):
        file_info = user_repo.get_file_lookup(filename)
        if not file_info:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File tidak ditemukan")

        is_public = file_info.get("file_type") in ["foto_profile", "banner", "chat_attachment"]
        
        if not is_public:
            auth_token = token
            if not auth_token:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    auth_token = auth_header.split(" ")[1]
            if not auth_token:
                raise HTTPException(status_code=401, detail="Token diperlukan")
            try:
                from app.auth import AuthService
                from jose import JWTError
                try:
                    payload = AuthService._decode_token(auth_token)
                except JWTError:
                    raise HTTPException(status_code=401, detail="Token tidak valid")
                    
                user = get_user(payload.get("sub"))
                if not user:
                    raise HTTPException(status_code=401, detail="User tidak valid")
                
                # Verifikasi akses mahasiswa
                if user["role"] == "mahasiswa":
                    if user["username"] != file_info["username"]:
                        raise HTTPException(status_code=403, detail="Akses ditolak. Anda hanya bisa melihat file Anda sendiri.")
                        
                # Verifikasi akses dosen
                elif user["role"] == "dosen":
                    file_owner = get_user(file_info["username"])
                    if not file_owner or file_owner.get("dosen_pembimbing") != user["username"]:
                        raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan dosen pembimbing mahasiswa ini.")
                        
                # Memblokir "admin" dan semua role yang tidak dikenal (Deny by default)
                else:
                    raise HTTPException(status_code=403, detail="Akses ditolak. Peran Anda tidak memiliki izin untuk melihat file ini.")
                    
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(status_code=401, detail="Token tidak valid")

        local_s3_dir = os.path.join(os.path.dirname(__file__), "..", "local_s3")
        file_path = os.path.join(local_s3_dir, bucket_name, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File fisik tidak ditemukan")
            
        return FileResponse(
            file_path,
            headers={
                "Cache-Control": "public, max-age=2592000, immutable" if is_public else "private, max-age=604800"
            }
        )

class ConnectionManager:
    def __init__(self):
        self.active_connections = {} # dict of username -> WebSocket
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]

    async def send_personal_message(self, message: dict, username: str):
        payload = json.dumps({"target": username, "message": message})
        try:
            await self.redis_client.publish("ws_chat_channel", payload)
        except Exception as e:
            print(f"Redis publish error: {e}")

    async def _send_local_message(self, message: dict, username: str):
        if username in self.active_connections:
            try:
                await self.active_connections[username].send_json(message)
            except Exception:
                self.disconnect(username)

    async def pubsub_reader(self):
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe("ws_chat_channel")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    target = data.get("target")
                    msg = data.get("message")
                    if target and msg:
                        await self._send_local_message(msg, target)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print("PubSub Reader Error:", e)
        finally:
            await pubsub.unsubscribe("ws_chat_channel")

manager = ConnectionManager()


async def handle_websocket_connection(websocket: WebSocket, username: str):
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


class ChatController:
    def __init__(self):
        self.router = APIRouter(prefix="/chat", tags=["Chat"])
        self.router.add_api_route("/contacts", self.get_contacts, methods=["GET"])
        self.router.add_api_route("/unread", self.get_unread, methods=["GET"])
        self.router.add_api_route("/history/{partner_username}", self.get_history, methods=["GET"])
        self.router.add_api_route("/mark-read/{partner_username}", self.mark_read, methods=["POST"])
        self.router.add_api_route("/send", self.send_message, methods=["POST"])
        self.router.add_api_route("/upload-attachment", self.upload_attachment, methods=["POST"])
        
        @self.router.websocket("/ws/{username}")
        async def websocket_endpoint(websocket: WebSocket, username: str):
            await handle_websocket_connection(websocket, username)

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
            updated = user_repo.mark_chat_read(sender=partner_username, receiver=user["username"])
            if updated > 0:
                cache_manager.delete_cache(f"chat_unread_{user['username']}")
        return user_repo.get_chat_history(user["username"], partner_username, limit=limit, offset=offset)

    @staticmethod
    def mark_read(partner_username: str, user: dict = Depends(get_current_user)):
        if not partner_username.startswith('GROUP_'):
            updated = user_repo.mark_chat_read(sender=partner_username, receiver=user["username"])
            if updated > 0:
                cache_manager.delete_cache(f"chat_unread_{user['username']}")
        return {"message": "Telah dibaca"}

    @staticmethod
    async def upload_attachment(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
        file_bytes = await file.read()
        import os
        import uuid
        import io
        
        def _sync_ops():
            ext = os.path.splitext(file.filename)[1]
            file_hash = f"chat_{uuid.uuid4().hex}{ext}"
            
            s3_storage.put_object(io.BytesIO(file_bytes), file_hash)
            public_url = s3_storage.get_url(file_hash)
            
            ext_lower = ext.lower()
            attachment_type = "image" if ext_lower in [".jpg", ".jpeg", ".png", ".gif", ".webp"] else "document"
            
            user_repo.insert_file_lookup(file_hash, current_user["username"], "chat_attachment")
            
            return {"url": public_url, "type": attachment_type, "filename": file.filename}

        return await run_in_threadpool(_sync_ops)

    @staticmethod
    async def send_message(body: PesanCreate, user: dict = Depends(get_current_user)):
        def _sync_ops():
            from datetime import datetime
            data = {
                "sender_username": user["username"],
                "receiver_username": body.receiver_username,
                "pesan": body.pesan,
                "waktu_kirim": datetime.now(),
                "attachment_url": body.attachment_url,
                "attachment_type": body.attachment_type,
                "attachment_name": body.attachment_name
            }
            msg_id = user_repo.insert_pesan(data)
            data["id"] = msg_id
            data["is_read"] = 0
            data["waktu_kirim"] = data["waktu_kirim"].isoformat()
            
            data["sender_full_name"] = user["full_name"]
            data["sender_foto_profile"] = user["foto_profile"]
            data["isNew"] = True
            
            members = []
            if body.receiver_username.startswith('GROUP_'):
                dosen_username = body.receiver_username.replace('GROUP_', '')
                members = user_repo.get_group_members(dosen_username)
                
            return data, members

        data, members = await run_in_threadpool(_sync_ops)
        ws_payload = {"type": "chat", "data": data}
        
        if body.receiver_username.startswith('GROUP_'):
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


@asynccontextmanager
async def lifespan_context(app: FastAPI):
    task = asyncio.create_task(manager.pubsub_reader())
    yield
    task.cancel()

class ApplicationServer:
    def __init__(self):
        self.app = FastAPI(
            title="Login API",
            description="Backend API untuk Login",
            version="1.0.0",
            lifespan=lifespan_context,
            debug=True
        )
        self._configure_cors()
        self._register_routes()
        self._register_exception_handlers()

    def _configure_cors(self):
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://agricareer.site",
                "https://www.agricareer.site",
                "https://agricareer-frontend.pages.dev",
                "https://agricareer.pages.dev"

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
        self.app.include_router(SystemController().router)

        @self.app.websocket("/api/chat/ws/{username}")
        async def api_websocket_endpoint(websocket: WebSocket, username: str):
            await handle_websocket_connection(websocket, username)

    def _register_exception_handlers(self):
        import traceback
        from fastapi.responses import JSONResponse
        from fastapi.exceptions import RequestValidationError
        from starlette.exceptions import HTTPException as StarletteHTTPException
        import logging

        logger = logging.getLogger("uvicorn.error")

        @self.app.exception_handler(Exception)
        async def global_exception_handler(request: Request, exc: Exception):
            if isinstance(exc, (HTTPException, StarletteHTTPException, RequestValidationError)):
                # Biarkan FastAPI menangani error ini secara native
                raise exc

            tb_str = traceback.format_exc()
            error_message = str(exc)
            
            # Coba ambil identitas pengguna dari header Authorization jika ada
            username = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    token = auth_header.split(" ")[1]
                    from app.auth import _decode_token
                    payload = _decode_token(token)
                    username = payload.get("sub")
                except Exception:
                    pass

            # Simpan error ke database
            try:
                user_repo.insert_error_log(
                    endpoint=str(request.url.path),
                    method=request.method,
                    error_message=error_message,
                    traceback_str=tb_str,
                    username=username
                )
            except Exception as db_err:
                logger.error(f"Failed to log error to DB: {db_err}")
                
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error"}
            )

    def get_app(self) -> FastAPI:
        return self.app


server = ApplicationServer()
app = server.get_app()
