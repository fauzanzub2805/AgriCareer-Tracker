import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

class Database:
    def __init__(self, db_name: str = "app.db"):
        self.db_name = db_name
        self.setup()

    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def setup(self) -> None:
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
                    disabled BOOLEAN NOT NULL DEFAULT 0
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS lowongan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    perusahaan TEXT NOT NULL,
                    posisi TEXT NOT NULL,
                    lokasi TEXT,
                    deskripsi TEXT,
                    tanggal_tutup DATE,
                    status_aktif BOOLEAN DEFAULT 1
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS lamaran (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_lowongan INTEGER NOT NULL,
                    username_mahasiswa TEXT NOT NULL,
                    status_lamaran TEXT NOT NULL,
                    tanggal_kirim DATE,
                    FOREIGN KEY (id_lowongan) REFERENCES lowongan (id),
                    FOREIGN KEY (username_mahasiswa) REFERENCES users (username)
                )
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS pengumuman (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    judul TEXT NOT NULL,
                    isi TEXT NOT NULL,
                    tanggal_dibuat DATE,
                    penulis TEXT
                )
            ''')
            conn.commit()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(plain_password: str) -> str:
        return pwd_context.hash(plain_password)


class UserRepository:
    def __init__(self, db: Database):
        self.db = db

    def get_user(self, username: str) -> dict | None:
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM users WHERE username = ?", (username,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_all_users(self) -> list:
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT username, full_name, email, nim, nip, role, disabled FROM users ORDER BY username")
            return [dict(row) for row in cursor.fetchall()]

    def get_lowongan_by_id(self, lowongan_id: int) -> dict | None:
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM lowongan WHERE id = ?", (lowongan_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_all_lowongan(self) -> list:
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM lowongan ORDER BY id DESC")
            return [dict(row) for row in cursor.fetchall()]

    def insert_lowongan(self, data: dict) -> int:
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                '''
                INSERT INTO lowongan (perusahaan, posisi, lokasi, deskripsi, tanggal_tutup, status_aktif)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                (data["perusahaan"], data["posisi"], data["lokasi"], data["deskripsi"], data["tanggal_tutup"], data["status_aktif"])
            )
            conn.commit()
            return cursor.lastrowid

    def update_lowongan(self, id: int, data: dict) -> None:
        with self.db.get_connection() as conn:
            conn.execute(
                '''
                UPDATE lowongan 
                SET perusahaan=?, posisi=?, lokasi=?, deskripsi=?, tanggal_tutup=?, status_aktif=?
                WHERE id=?
                ''',
                (data["perusahaan"], data["posisi"], data["lokasi"], data["deskripsi"], data["tanggal_tutup"], data["status_aktif"], id)
            )
            conn.commit()

    def get_all_pengumuman(self) -> list:
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM pengumuman ORDER BY id DESC")
            return [dict(row) for row in cursor.fetchall()]

    def get_lamaran_by_mahasiswa(self, username: str) -> list:
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT l.*, lw.perusahaan, lw.posisi 
                FROM lamaran l
                JOIN lowongan lw ON l.id_lowongan = lw.id
                WHERE l.username_mahasiswa = ?
                ''', (username,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def insert_user(self, user_data: dict) -> None:
        with self.db.get_connection() as conn:
            conn.execute(
                '''
                INSERT INTO users
                (username, full_name, email, nim, nip, role, hashed_password, disabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    user_data["username"],
                    user_data["full_name"],
                    user_data.get("email"),
                    user_data.get("nim"),
                    user_data.get("nip"),
                    user_data["role"],
                    user_data["hashed_password"],
                    user_data.get("disabled", False)
                )
            )
            conn.commit()

    def update_user_role(self, username: str, new_role: str) -> None:
        with self.db.get_connection() as conn:
            conn.execute(
                "UPDATE users SET role = ? WHERE username = ?",
                (new_role, username)
            )
            conn.commit()


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
                    # We only extract the pengumuman part from the script or just run it and ignore duplicates
                    # But it's easier to just run the script again. Let's not run the whole script.
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
