import argparse
import sys
from app.db import SessionLocal, init_db
from app.models import User
from app.services.privacy import hash_password


def buat_admin(email: str, password: str = "AdminFisGrade2026!", nama: str = "Administrator"):
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User with email {email} already exists.")
            return

        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            nama_tampil=nama
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created successfully: {email}")
    finally:
        db.close()


def jalankan_skenario():
    import pytest
    print("Menjalankan 10 skenario FisGrade...")
    exit_code = pytest.main(["-v", "tests/test_scenarios.py"])
    sys.exit(exit_code)


def main():
    parser = argparse.ArgumentParser(description="FisGrade CLI Tools")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # buat_admin
    parser_admin = subparsers.add_parser("buat_admin", help="Buat akun admin")
    parser_admin.add_argument("--email", required=True, help="Email admin")
    parser_admin.add_argument("--password", default="AdminFisGrade2026!", help="Kata sandi")
    parser_admin.add_argument("--nama", default="Administrator", help="Nama tampilan")

    # jalankan_skenario
    subparsers.add_parser("jalankan_skenario", help="Jalankan harness uji skenario")

    args = parser.parse_args()
    if args.command == "buat_admin":
        buat_admin(args.email, args.password, args.nama)
    elif args.command == "jalankan_skenario":
        jalankan_skenario()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
