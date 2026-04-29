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


import json
import os

db_instance = Database(r"D:\Workspace\ADS\ADSdb")
user_repo = UserRepository(db_instance)

# def load_default_users(json_path: str = "users.json"):
#     if not os.path.exists(json_path):
#         return
#     with open(json_path, "r", encoding="utf-8") as file:
#         users_data = json.load(file)
#         for user in users_data:
#             user["hashed_password"] = pwd_context.hash(user.pop("password"))
#             user_repo.insert_user(user)

# load_default_users(os.path.join(os.path.dirname(__file__), "..", "users.json"))

def get_user(username: str):
    return user_repo.get_user(username)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return Database.verify_password(plain_password, hashed_password)

