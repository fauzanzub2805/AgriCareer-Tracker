"""
In-memory user store (replace with a real database in production).
Passwords are stored as sha256_crypt hashes (avoids bcrypt version conflicts).
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# Roles: mahasiswa | admin | dosen
USERS_DB: dict[str, dict] = {
    "mhs_arip": {
        "username": "mhs_arip",
        "full_name": "Arief Abdul Rahman",
        "email": "aar.arief@apps.ipb.ac.id",
        "nim": "G6401231038",
        "nip": None,
        "role": "mahasiswa",
        # plain: mahasiswa123
        "hashed_password": pwd_context.hash("mahasiswa123"),
        "disabled": False,
    },
    "etmin_ludwik": {
        "username": "etmin_ludwik",
        "full_name": "Ludwig Alven T. L. Tobing",
        "email": "tobingludwig@apps.ipb.ac.id",
        "nim": None,
        "nip": "G6401231006",
        "role": "admin",
        # plain: admin123
        "hashed_password": pwd_context.hash("admin123"),
        "disabled": False,
    },
    "dosen_ojan": {
        "username": "dosen_ojan",
        "full_name": "Muhammad Fauzan Zubaedi",
        "email": "fauzanzubaedi@apps.ipb.ac.id",
        "nim": None,
        "nip": "G6401231129",
        "role": "dosen",
        # plain: dosen123
        "hashed_password": pwd_context.hash("dosen123"),
        "disabled": False,
    },
}


def get_user(username: str):
    return USERS_DB.get(username)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
