import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

class Database:
    def __init__(self, db_name: str = "app.db"):
        self._db_name = db_name
        self.__setup()

    def get_connection(self):
        conn = sqlite3.connect(self._db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def __setup(self) -> None:
        with self.get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    nim TEXT,
                    nip TEXT,
                    role TEXT NOT NULL,
                    hashed_password TEXT NOT NULL,
                    disabled BOOLEAN NOT NULL DEFAULT 0,
                    is_verified BOOLEAN NOT NULL DEFAULT 0,
                    foto_profile TEXT,
                    cv_path TEXT,
                    transkrip_path TEXT
                )
            ''')
            
            # Migrasi penambahan kolom jika database sudah ada sebelumnya
            cursor = conn.execute("PRAGMA table_info(users)")
            columns = [info['name'] for info in cursor.fetchall()]
            if 'foto_profile' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN foto_profile TEXT')
            if 'cv_path' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN cv_path TEXT')
            if 'transkrip_path' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN transkrip_path TEXT')
            if 'dosen_pembimbing' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN dosen_pembimbing TEXT REFERENCES users(username)')
            if 'is_verified' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS lowongan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    perusahaan TEXT NOT NULL,
                    posisi TEXT NOT NULL,
                    lokasi TEXT,
                    deskripsi TEXT,
                    tanggal_tutup DATE,
                    status_aktif BOOLEAN DEFAULT 1,
                    banner_path TEXT,
                    persyaratan TEXT,
                    benefit TEXT
                )
            ''')
            
            # Migration for lowongan table
            cursor = conn.execute("PRAGMA table_info(lowongan)")
            lowongan_columns = [info['name'] for info in cursor.fetchall()]
            if 'banner_path' not in lowongan_columns:
                conn.execute('ALTER TABLE lowongan ADD COLUMN banner_path TEXT')
            if 'persyaratan' not in lowongan_columns:
                conn.execute('ALTER TABLE lowongan ADD COLUMN persyaratan TEXT')
            if 'benefit' not in lowongan_columns:
                conn.execute('ALTER TABLE lowongan ADD COLUMN benefit TEXT')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS lamaran (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_lowongan INTEGER NOT NULL,
                    username_mahasiswa TEXT NOT NULL,
                    status_lamaran TEXT NOT NULL,
                    tanggal_kirim DATE,
                    posisi TEXT,
                    FOREIGN KEY (id_lowongan) REFERENCES lowongan (id),
                    FOREIGN KEY (username_mahasiswa) REFERENCES users (username)
                )
            ''')

            # Migrasi penambahan kolom posisi jika belum ada
            cursor = conn.execute("PRAGMA table_info(lamaran)")
            lamaran_columns = [info['name'] for info in cursor.fetchall()]
            if 'posisi' not in lamaran_columns:
                conn.execute('ALTER TABLE lamaran ADD COLUMN posisi TEXT')
            if 'bukti_penerimaan_path' not in lamaran_columns:
                conn.execute('ALTER TABLE lamaran ADD COLUMN bukti_penerimaan_path TEXT')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS pengumuman (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    judul TEXT NOT NULL,
                    isi TEXT NOT NULL,
                    tanggal_dibuat DATE,
                    penulis TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS file_lookup (
                    file_hash TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    FOREIGN KEY (username) REFERENCES users (username)
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS pesan_chat (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_username TEXT NOT NULL,
                    receiver_username TEXT NOT NULL,
                    pesan TEXT NOT NULL,
                    waktu_kirim DATETIME NOT NULL,
                    is_read BOOLEAN DEFAULT 0,
                    attachment_url TEXT,
                    attachment_type TEXT,
                    attachment_name TEXT,
                    FOREIGN KEY (sender_username) REFERENCES users (username),
                    FOREIGN KEY (receiver_username) REFERENCES users (username)
                )
            ''')

            # Migrasi penambahan kolom attachment pada chat
            cursor = conn.execute("PRAGMA table_info(pesan_chat)")
            chat_columns = [info['name'] for info in cursor.fetchall()]
            if 'attachment_url' not in chat_columns:
                conn.execute('ALTER TABLE pesan_chat ADD COLUMN attachment_url TEXT')
            if 'attachment_type' not in chat_columns:
                conn.execute('ALTER TABLE pesan_chat ADD COLUMN attachment_type TEXT')
            if 'attachment_name' not in chat_columns:
                conn.execute('ALTER TABLE pesan_chat ADD COLUMN attachment_name TEXT')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS notifikasi (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username_penerima TEXT NOT NULL,
                    judul TEXT NOT NULL,
                    pesan TEXT NOT NULL,
                    link_path TEXT,
                    is_read BOOLEAN DEFAULT 0,
                    tanggal_dibuat DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (username_penerima) REFERENCES users (username)
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS error_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    endpoint TEXT,
                    method TEXT,
                    error_message TEXT,
                    stack_trace TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tambahan Indeks untuk Optimasi Performa
            conn.execute('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_lamaran_mahasiswa ON lamaran(username_mahasiswa)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_lamaran_lowongan ON lamaran(id_lowongan)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_pesan_sender ON pesan_chat(sender_username)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_pesan_receiver ON pesan_chat(receiver_username)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_notifikasi_penerima ON notifikasi(username_penerima)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_error_logs_waktu ON error_logs(created_at)')
            
            conn.commit()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(plain_password: str) -> str:
        return pwd_context.hash(plain_password)


class UserRepository:
    def __init__(self, db: Database):
        self._db = db

    def get_user(self, username: str) -> dict | None:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM users WHERE username = ?", (username,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_user_by_email(self, email: str) -> dict | None:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM users WHERE email = ?", (email,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_all_users(self) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute('''
                SELECT u.username, u.full_name, u.email, u.nim, u.nip, u.role, u.disabled, u.is_verified, u.dosen_pembimbing,
                       d.full_name as nama_dosen_pembimbing
                FROM users u
                LEFT JOIN users d ON u.dosen_pembimbing = d.username
                ORDER BY u.username
            ''')
            return [dict(row) for row in cursor.fetchall()]

    def update_user_dosen(self, username: str, dosen_username: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE users SET dosen_pembimbing = ? WHERE username = ?",
                (dosen_username, username)
            )
            conn.commit()

    def get_lowongan_by_id(self, lowongan_id: int) -> dict | None:
        with self._db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM lowongan WHERE id = ?", (lowongan_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_all_lowongan(self, limit: int = None, offset: int = None) -> list:
        with self._db.get_connection() as conn:
            query = "SELECT * FROM lowongan ORDER BY id DESC"
            params = []
            if limit is not None:
                query += " LIMIT ?"
                params.append(limit)
                if offset is not None:
                    query += " OFFSET ?"
                    params.append(offset)
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def insert_lowongan(self, data: dict) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO lowongan (perusahaan, posisi, lokasi, deskripsi, tanggal_tutup, status_aktif, banner_path, persyaratan, benefit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (data["perusahaan"], data["posisi"], data["lokasi"], data["deskripsi"], data["tanggal_tutup"], data["status_aktif"], data.get("banner_path"), data.get("persyaratan"), data.get("benefit"))
            )
            conn.commit()
            return cursor.lastrowid

    def update_lowongan(self, id: int, data: dict) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                '''
                UPDATE lowongan 
                SET perusahaan=?, posisi=?, lokasi=?, deskripsi=?, tanggal_tutup=?, status_aktif=?, banner_path=?, persyaratan=?, benefit=?
                WHERE id=?
                ''',
                (data["perusahaan"], data["posisi"], data["lokasi"], data["deskripsi"], data["tanggal_tutup"], data["status_aktif"], data.get("banner_path"), data.get("persyaratan"), data.get("benefit"), id)
            )
            conn.commit()

    def get_all_pengumuman(self) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM pengumuman ORDER BY id DESC")
            return [dict(row) for row in cursor.fetchall()]

    def insert_pengumuman(self, data: dict) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO pengumuman (judul, isi, tanggal_dibuat, penulis)
                VALUES (?, ?, ?, ?)
                ''',
                (data["judul"], data["isi"], data["tanggal_dibuat"], data["penulis"])
            )
            conn.commit()
            return cursor.lastrowid

    def update_pengumuman(self, id: int, data: dict) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                '''
                UPDATE pengumuman 
                SET judul=?, isi=?
                WHERE id=?
                ''',
                (data["judul"], data["isi"], id)
            )
            conn.commit()

    def delete_pengumuman(self, id: int) -> None:
        with self._db.get_connection() as conn:
            conn.execute("DELETE FROM pengumuman WHERE id=?", (id,))
            conn.commit()

    def get_lamaran_by_mahasiswa(self, username: str) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT l.*, lw.perusahaan, lw.tanggal_tutup, COALESCE(l.posisi, lw.posisi) as posisi_lamaran 
                FROM lamaran l
                JOIN lowongan lw ON l.id_lowongan = lw.id
                WHERE l.username_mahasiswa = ?
                ORDER BY l.tanggal_kirim DESC
                ''',
                (username,)
            )
            return [dict(row) for row in cursor.fetchall()]

    # CHAT METHODS
    def insert_pesan(self, data: dict) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO pesan_chat (sender_username, receiver_username, pesan, waktu_kirim, attachment_url, attachment_type, attachment_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''',
                (data["sender_username"], data["receiver_username"], data.get("pesan", ""), data["waktu_kirim"], data.get("attachment_url"), data.get("attachment_type"), data.get("attachment_name"))
            )
            conn.commit()
            return cursor.lastrowid

    def get_chat_history(self, user1: str, user2: str, limit: int = 10, offset: int = 0) -> list:
        with self._db.get_connection() as conn:
            if user2.startswith('GROUP_'):
                cursor = conn.execute(
                    '''
                    SELECT p.id, p.sender_username, p.receiver_username, p.pesan, p.waktu_kirim, p.is_read,
                           p.attachment_url, p.attachment_type, p.attachment_name, u.full_name as sender_full_name, u.foto_profile as sender_foto_profile
                    FROM pesan_chat p
                    JOIN users u ON p.sender_username = u.username
                    WHERE p.receiver_username = ?
                    ORDER BY p.waktu_kirim DESC
                    LIMIT ? OFFSET ?
                    ''',
                    (user2, limit, offset)
                )
            else:
                cursor = conn.execute(
                    '''
                    SELECT id, sender_username, receiver_username, pesan, waktu_kirim, is_read, attachment_url, attachment_type, attachment_name
                    FROM pesan_chat
                    WHERE (sender_username = ? AND receiver_username = ?)
                       OR (sender_username = ? AND receiver_username = ?)
                    ORDER BY waktu_kirim DESC
                    LIMIT ? OFFSET ?
                    ''',
                    (user1, user2, user2, user1, limit, offset)
                )
            rows = [dict(row) for row in cursor.fetchall()]
            rows.reverse()
            return rows
            
    def mark_chat_read(self, sender: str, receiver: str) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                UPDATE pesan_chat SET is_read = 1 
                WHERE sender_username = ? AND receiver_username = ? AND is_read = 0
                ''',
                (sender, receiver)
            )
            conn.commit()
            return cursor.rowcount

    def get_contacts_dosen(self, dosen_username: str) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT username, full_name, foto_profile, nim,
                       (SELECT COUNT(*) FROM pesan_chat 
                        WHERE sender_username = users.username 
                        AND receiver_username = ? AND is_read = 0) as unread_count
                FROM users 
                WHERE dosen_pembimbing = ? AND role = 'mahasiswa'
                ORDER BY full_name ASC
                ''',
                (dosen_username, dosen_username)
            )
            contacts = [dict(row) for row in cursor.fetchall()]
            
            group_contact = {
                "username": f"GROUP_{dosen_username}",
                "full_name": "Grup Bimbingan",
                "foto_profile": None,
                "nim": None,
                "is_group": True
            }
            contacts.insert(0, group_contact)
            return contacts

    def get_unread_count(self, receiver: str) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT COUNT(*) as count
                FROM pesan_chat
                WHERE receiver_username = ? AND is_read = 0
                ''',
                (receiver,)
            )
            result = cursor.fetchone()
            return result["count"] if result else 0

    def get_contacts_mahasiswa(self, dosen_username: str, mahasiswa_username: str) -> list:
        if not dosen_username:
            return []
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT username, full_name, foto_profile, nip,
                       (SELECT COUNT(*) FROM pesan_chat 
                        WHERE sender_username = users.username 
                        AND receiver_username = ? AND is_read = 0) as unread_count
                FROM users 
                WHERE username = ? AND role = 'dosen'
                ''',
                (mahasiswa_username, dosen_username)
            )
            contacts = [dict(row) for row in cursor.fetchall()]
            
            if contacts:
                group_contact = {
                    "username": f"GROUP_{dosen_username}",
                    "full_name": "Grup Bimbingan",
                    "foto_profile": None,
                    "nip": None,
                    "is_group": True
                }
                contacts.insert(0, group_contact)
            return contacts

    def get_group_members(self, dosen_username: str) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT username
                FROM users 
                WHERE username = ? OR dosen_pembimbing = ?
                ''',
                (dosen_username, dosen_username)
            )
            return [row["username"] for row in cursor.fetchall()]

    def get_all_lamaran(self) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT l.*, lw.perusahaan, lw.tanggal_tutup, COALESCE(l.posisi, lw.posisi) as posisi_lamaran,
                       u.full_name, u.nim, u.email, u.cv_path
                FROM lamaran l
                JOIN lowongan lw ON l.id_lowongan = lw.id
                JOIN users u ON l.username_mahasiswa = u.username
                ORDER BY l.id DESC
                '''
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_lamaran_by_dosen(self, dosen_username: str) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT l.*, lw.perusahaan, lw.tanggal_tutup, COALESCE(l.posisi, lw.posisi) as posisi_lamaran,
                       u.full_name, u.nim, u.email, u.cv_path
                FROM lamaran l
                JOIN lowongan lw ON l.id_lowongan = lw.id
                JOIN users u ON l.username_mahasiswa = u.username
                WHERE u.dosen_pembimbing = ?
                ORDER BY l.id DESC
                ''',
                (dosen_username,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def update_lamaran_status(self, lamaran_id: int, new_status: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE lamaran SET status_lamaran = ? WHERE id = ?",
                (new_status, lamaran_id)
            )
            conn.commit()

    def update_lamaran_bukti(self, lamaran_id: int, bukti_path: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE lamaran SET bukti_penerimaan_path = ? WHERE id = ?",
                (bukti_path, lamaran_id)
            )
            conn.commit()

    def get_lamaran_by_id(self, lamaran_id: int, username: str = None) -> dict | None:
        with self._db.get_connection() as conn:
            query = '''
                SELECT l.*, lw.perusahaan, lw.posisi as posisi_lowongan, lw.lokasi, lw.deskripsi, lw.tanggal_tutup,
                       COALESCE(l.posisi, lw.posisi) as posisi_lamaran,
                       u.full_name, u.nim, u.email, u.cv_path
                FROM lamaran l
                JOIN lowongan lw ON l.id_lowongan = lw.id
                JOIN users u ON l.username_mahasiswa = u.username
                WHERE l.id = ?
            '''
            params = [lamaran_id]
            if username:
                query += " AND l.username_mahasiswa = ?"
                params.append(username)
                
            cursor = conn.execute(query, params)
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def insert_lamaran(self, data: dict) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO lamaran (id_lowongan, username_mahasiswa, status_lamaran, tanggal_kirim, posisi)
                VALUES (?, ?, ?, DATE('now'), ?)
                ''',
                (data["id_lowongan"], data["username_mahasiswa"], "Menunggu", data.get("posisi"))
            )
            conn.commit()
            return cursor.lastrowid

    def check_existing_lamaran(self, id_lowongan: int, username_mahasiswa: str, posisi: str) -> bool:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT id FROM lamaran WHERE id_lowongan = ? AND username_mahasiswa = ? AND (posisi = ? OR posisi IS NULL)",
                (id_lowongan, username_mahasiswa, posisi)
            )
            return cursor.fetchone() is not None

    def insert_user(self, user_data: dict) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                '''
                INSERT INTO users
                (username, full_name, email, nim, nip, role, hashed_password, disabled, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    user_data["username"],
                    user_data["full_name"],
                    user_data.get("email"),
                    user_data.get("nim"),
                    user_data.get("nip"),
                    user_data["role"],
                    user_data["hashed_password"],
                    user_data.get("disabled", False),
                    user_data.get("is_verified", False)
                )
            )
            conn.commit()

    def update_user_role(self, username: str, new_role: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE users SET role = ? WHERE username = ?",
                (new_role, username)
            )
            conn.commit()

    def update_user_file(self, username: str, file_type: str, file_path: str | None) -> None:
        valid_columns = {"foto_profile", "cv_path", "transkrip_path"}
        if file_type not in valid_columns:
            raise ValueError(f"Invalid file type: {file_type}")
            
        with self._db.get_connection() as conn:
            conn.execute(
                f"UPDATE users SET {file_type} = ? WHERE username = ?",
                (file_path, username)
            )
            conn.commit()

    def update_is_verified(self, username: str, status: bool) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE users SET is_verified = ? WHERE username = ?",
                (status, username)
            )
            conn.commit()

    def update_password(self, username: str, new_hashed_password: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE users SET hashed_password = ? WHERE username = ?",
                (new_hashed_password, username)
            )
            conn.commit()

    def insert_file_lookup(self, file_hash: str, username: str, file_type: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                '''
                INSERT INTO file_lookup (file_hash, username, file_type)
                VALUES (?, ?, ?)
                ''',
                (file_hash, username, file_type)
            )
            conn.commit()

    def get_file_lookup(self, file_hash: str) -> dict | None:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM file_lookup WHERE file_hash = ?", (file_hash,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def delete_file_lookup(self, file_hash: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "DELETE FROM file_lookup WHERE file_hash = ?", (file_hash,)
            )
            conn.commit()

    # NOTIFIKASI METHODS
    def insert_notifikasi(self, data: dict) -> int:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO notifikasi (username_penerima, judul, pesan, link_path, is_read, tanggal_dibuat)
                VALUES (?, ?, ?, ?, 0, datetime('now', 'localtime'))
                ''',
                (data["username_penerima"], data["judul"], data["pesan"], data.get("link_path"))
            )
            conn.commit()
            return cursor.lastrowid

    def get_notifikasi_by_user(self, username: str) -> list:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT * FROM notifikasi 
                WHERE username_penerima = ? 
                ORDER BY tanggal_dibuat DESC
                ''',
                (username,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def mark_notifikasi_as_read(self, notif_id: int, username: str) -> bool:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "UPDATE notifikasi SET is_read = 1 WHERE id = ? AND username_penerima = ?",
                (notif_id, username)
            )
            conn.commit()
            return cursor.rowcount > 0

    def mark_all_notifikasi_as_read(self, username: str) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                "UPDATE notifikasi SET is_read = 1 WHERE username_penerima = ?",
                (username,)
            )
            conn.commit()

    def insert_error_log(self, endpoint: str, method: str, error_message: str, traceback_str: str, username: str = None) -> None:
        with self._db.get_connection() as conn:
            conn.execute(
                '''
                INSERT INTO error_logs (endpoint, method, error_message, stack_trace, username)
                VALUES (?, ?, ?, ?, ?)
                ''',
                (endpoint, method, error_message, traceback_str, username)
            )
            conn.commit()

    def get_error_logs(self, limit: int = 50, offset: int = 0) -> list[dict]:
        with self._db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            return [dict(row) for row in cursor.fetchall()]


import json
import os

# Database path - relative to backend directory
db_dir = os.path.join(os.path.dirname(__file__), "..", "adsdb")
os.makedirs(db_dir, exist_ok=True)
db_file = os.path.join(db_dir, "app.db")

db_instance = Database(db_file)
user_repo = UserRepository(db_instance)

def load_default_sql_seeding(sql_path: str):
    if not os.path.exists(sql_path):
        return
    with db_instance.get_connection() as conn:
        with open(sql_path, "r", encoding="utf-8") as file:
            sql_script = file.read()
            # Eksekusi script SQL, hindari jika data pada lowongan sudah terisi
            cur = conn.execute("SELECT COUNT(*) FROM lowongan")
            if cur.fetchone()[0] == 0:
                conn.executescript(sql_script)
            else:
                # Also check pengumuman, to allow re-seeding if we just added it
                cur_pengumuman = conn.execute("SELECT COUNT(*) FROM pengumuman")
                if cur_pengumuman.fetchone()[0] == 0:
                    pass

def load_default_users(json_path: str = "users.json"):
    if not os.path.exists(json_path):
        return
    with open(json_path, "r", encoding="utf-8") as file:
        users_data = json.load(file)
        for user in users_data:
            # Check if user already exists
            if user_repo.get_user(user["username"]):
                continue
            user["hashed_password"] = pwd_context.hash(user.pop("password"))
            user_repo.insert_user(user)

load_default_users(os.path.join(os.path.dirname(__file__), "..", "users.json"))
load_default_sql_seeding(os.path.join(os.path.dirname(__file__), "..", "sql_dump", "seed_lowongan_lamaran.sql"))

def get_user(username: str):
    return user_repo.get_user(username)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return Database.verify_password(plain_password, hashed_password)
