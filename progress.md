# Progress Projek — AgriCareer Tracker (Sistem Informasi Magang)

## Selesai

### Fondasi & Auth
- [x] Halaman Login (UI split-panel, error handling, loading spinner, demo credentials)
- [x] AuthContext (login/logout, simpan token ke localStorage, re-hydrate saat reload)
- [x] JWT backend (encode/decode, expire 60 menit, HS256)
- [x] Endpoint `POST /auth/login` dan `GET /auth/me`
- [x] Role Authorization — ProtectedRoute (redirect ke `/unauthorized` jika role salah)
- [x] Halaman Unauthorized
- [x] Axios service dengan interceptor Bearer token + auto-redirect 401

### Shell & Layout
- [x] AppLayout (sidebar + topbar dengan nama user, badge role, logout)
- [x] Design system CSS (custom properties, card, badge, alert, spinner, responsive)
- [x] Routing React Router v6 untuk 3 role (mahasiswa, admin, dosen)

### Dashboard (stub)
- [x] DashboardMahasiswa — stat cards + info profil
- [x] DashboardAdmin — stat cards + quick-action buttons (belum fungsional)
- [x] DashboardDosen — stat cards + daftar validasi pending (data hardcoded)

---

## Belum Selesai

### Database
- [ ] Ganti in-memory user store (`models.py`) dengan database sungguhan (PostgreSQL / SQLite)
- [ ] ORM / migrasi skema (SQLAlchemy + Alembic)
- [ ] Seed data awal

### Halaman Mahasiswa
- [ ] `/mahasiswa/lowongan` — daftar & detail lowongan magang
- [ ] `/mahasiswa/lamaran` — status lamaran yang sudah dikirim
- [ ] `/mahasiswa/logbook` — input & riwayat logbook digital

### Halaman Admin
- [ ] `/admin/users` — manajemen pengguna (tambah, edit, nonaktifkan)
- [ ] `/admin/lowongan` — kelola posting lowongan
- [ ] `/admin/tenggat` — atur tenggat waktu

### Halaman Dosen
- [ ] `/dosen/lamaran` — validasi lamaran mahasiswa bimbingan
- [ ] `/dosen/logbook` — validasi & komentar logbook

### Backend Endpoints (real data, bukan stub)
- [ ] CRUD lowongan magang
- [ ] Submit & tracking lamaran
- [ ] CRUD logbook + validasi oleh dosen
- [ ] Endpoint stats dashboard (ganti angka hardcoded)
- [ ] Manajemen pengguna oleh admin

### Fitur UI yang Belum Fungsional
- [ ] "Ingat saya" pada halaman login
- [ ] "Lupa kata sandi?" — alur reset password
- [ ] Tombol quick-action admin (Tambah Pengguna, Tambah Lowongan, Atur Tenggat)
- [ ] Tombol Review di daftar validasi dosen

### Lain-lain
- [ ] Ganti `SECRET_KEY` placeholder di `.env` sebelum production
- [ ] Setup testing (Vitest / pytest)
- [ ] ESLint / linting setup
- [ ] Error boundary React
- [ ] Pagination pada daftar data

---

## Urutan Prioritas yang Disarankan

1. **Database layer** — tanpa ini semua fitur lain tidak bisa berjalan nyata
2. **Lowongan & Lamaran** (alur inti mahasiswa)
3. **Validasi Dosen** (bergantung pada data lamaran)
4. **Manajemen Pengguna & Lowongan Admin**
5. **Logbook Digital**
6. **Fitur pelengkap** (lupa password, remember me, pagination, testing)
