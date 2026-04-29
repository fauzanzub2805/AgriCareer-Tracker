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