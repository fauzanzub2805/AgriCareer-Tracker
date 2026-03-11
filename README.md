# AgriCareer

Aplikasi web untuk mengelola program magang mahasiswa, mencakup pendaftaran lowongan, tracking lamaran, logbook digital, dan validasi oleh dosen pembimbing.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | FastAPI (Python 3.11+) |
| Auth | JWT Bearer Token (HS256, expire 60 menit) |

## Prasyarat

- Python 3.11+
- Node.js 18+

## Menjalankan Aplikasi

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Akun Demo

| Role | Username | Password |
|------|----------|----------|
| Mahasiswa | mahasiswa | password |
| Admin | admin | password |
| Dosen | dosen | password |

## Struktur Proyek

```
ADS/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app + routes
│   │   ├── auth.py       # JWT logic
│   │   ├── models.py     # In-memory user store
│   │   └── schemas.py    # Pydantic schemas
│   └── requirements.txt
└── frontend/
    └── src/
        ├── context/AuthContext.jsx     # Auth state
        ├── components/
        │   ├── AppLayout.jsx           # Sidebar + topbar
        │   └── ProtectedRoute.jsx      # Role-based guard
        ├── pages/                      # Dashboard per role + Login
        └── services/api.js             # Axios + interceptors
```

## Status

Lihat [progress.md](progress.md) untuk daftar fitur yang sudah selesai dan yang masih dalam pengerjaan.

## Akun Demo

| Peran | Username | Password | Redirect setelah login |
|---|---|---|---|
| Mahasiswa | `mahasiswa1` | `mahasiswa123` | `/mahasiswa/dashboard` |
| Administrator | `admin1` | `admin123` | `/admin/dashboard` |
| Dosen Pembimbing | `dosen1` | `dosen123` | `/dosen/dashboard` |

---

## Alur Autentikasi

```
POST /auth/login  { username, password }
→ 200: { access_token, token_type, role, full_name }

GET  /auth/me     Authorization: Bearer <token>
→ 200: { username, full_name, role, email, nim/nip }
```

Token disimpan di `localStorage`. Axios interceptor secara otomatis
melampirkan header `Authorization: Bearer …` pada setiap request.
`ProtectedRoute` di frontend mengecek `user.role` sebelum merender halaman.

---

## Menambah Pengguna Baru

Edit `backend/app/models.py` — tambahkan entry baru di `USERS_DB`:

```python
"username_baru": {
    "username": "username_baru",
    "full_name": "Nama Lengkap",
    "email": "email@example.com",
    "nim": None,   # isi jika mahasiswa
    "nip": None,   # isi jika staf
    "role": "mahasiswa",  # mahasiswa | admin | dosen
    "hashed_password": pwd_context.hash("password_plain"),
    "disabled": False,
},
```

## Refresh USERS_DB
```bash
# 1. Cari PID worker yang berjalan
wmic process where "name like '%python%'" get ProcessId,CommandLine

# 2. Kill semua PID yang muncul (ganti dengan PID pada output sebelumnya)
wmic process where "ProcessId=XXXX or ProcessId=YYYY or ProcessId=ZZZZ" call terminate

# 3. Start ulang
cd backend
.venv/Scripts/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```