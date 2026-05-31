# [AgriCareer-Tracker](https://agricareer.site)
## Kelompok 14 Praktikum Analisis Disain Sistem P2

**Anggota Kelompok**
1. Arief Abdul Rahman (G6401231038)
2. Ludwig Alven Tama L. T. (G6401231006)
3. Muhammad Fauzan Zubaedi (G6401231129)

Pencarian tempat magang telah menjadi bagian integral dari kurikulum pendidikan tinggi untuk meningkatkan relevansi lulusan dengan dunia industri. Namun, dalam pelaksanaannya, mahasiswa sering kali menghadapi kompleksitas administratif dalam mengelola berbagai tahapan rekrutmen dan pelaporan.
Masalah utama yang ditemukan adalah fragmentasi informasi terkait lowongan, serta ketiadaan sistem terpusat untuk memantau status lamaran yang sedang berjalan. Oleh karena itu, diperlukan sebuah platform digital khusus untuk mengonsolidasikan seluruh aktivitas persiapan karier dan manajemen magang mahasiswa IPB.

IPB Internship & Career Tracker dikembangkan sebagai platform manajemen terintegrasi yang berfungsi sebagai pusat kendali aktivitas pra-karier mahasiswa. Solusi yang ditawarkan mencakup:

**Sentralisasi Data** 

Penyediaan basis data lowongan magang yang dapat dikurasi dan diakses secara mudah.

**Pipeline Tracking** 

Implementasi sistem pelacakan status lamaran yang intuitif (dari tahap Applied hingga Accepted/Rejected) untuk memberikan visibilitas penuh terhadap proses rekrutmen.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 4 |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite (dengan Python `sqlite3`) |
| Caching | Redis |
| Storage | Local S3 Mimic Storage |
| Auth | JWT Bearer Token (HS256) |

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

## Struktur Proyek

```text
AgriCareer-Tracker/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app + routes & controllers
│   │   ├── auth.py       # JWT logic & dependencies
│   │   ├── models.py     # Database queries & data access
│   │   ├── schemas.py    # Pydantic validation schemas
│   │   ├── storage.py    # Local S3 storage implementation
│   │   ├── cache.py      # Redis caching logic
│   │   └── mailer.py     # Email notification service
│   ├── adsdb/            # SQLite Database
│   ├── local_s3/         # Local file storage
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/                 # Reusable UI components
        ├── context/AuthContext.jsx     # Global authentication state
        ├── layouts/                    # App layouts (Sidebar, Topbar)
        ├── pages/                      # Role-based pages (Login, Dashboard, dll)
        ├── services/api.js             # Axios instance & interceptors
        ├── utils/                      # Helper functions
        ├── App.jsx                     # Router configuration
        └── index.css                   # Global styles & Tailwind
```

## Akun Demo

| Peran | Username | Password | Redirect setelah login |
|---|---|---|---|
| Mahasiswa | `mhs_arip` | `mahasiswa123` | `/mahasiswa/dashboard` |
| Administrator | `etmin_ludwik` | `admin123` | `/admin/dashboard` |
| Dosen Pembimbing | `dosen_ojan` | `dosen123` | `/dosen/dashboard` |

---
