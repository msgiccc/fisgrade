import json
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.db import SessionLocal, init_db
from app.models import Package, Question, QuestionKey


def seed_paket():
    init_db()
    db: Session = SessionLocal()
    try:
        current_dir = Path(__file__).parent
        seed_file = current_dir / "paket_newton_v1.json"
        if not seed_file.exists():
            print(f"Seed file not found: {seed_file}")
            return

        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        pkg_data = data["paket"]
        package = db.query(Package).filter(
            Package.kode == pkg_data["kode"],
            Package.versi == pkg_data["versi"]
        ).first()

        if not package:
            package = Package(
                kode=pkg_data["kode"],
                versi=pkg_data["versi"],
                judul=pkg_data["judul"],
                topik=pkg_data["topik"],
                status="aktif"
            )
            db.add(package)
            db.commit()
            db.refresh(package)
            print(f"Package created: {package.judul} v{package.versi}")
        else:
            print(f"Package already exists: {package.judul} v{package.versi}")

        for q_data in data["soal"]:
            question = db.query(Question).filter(
                Question.package_id == package.id,
                Question.urutan == q_data["urutan"]
            ).first()

            if not question:
                question = Question(
                    package_id=package.id,
                    urutan=q_data["urutan"],
                    teks_soal=q_data["teks"],
                    parameter_json=q_data["parameter"]
                )
                db.add(question)
                db.commit()
                db.refresh(question)
                print(f"Question created: Soal {question.urutan}")
            else:
                print(f"Question already exists: Soal {question.urutan}")

            # Question keys
            kunci_dict = q_data["kunci"]
            rubrik_dict = q_data["rubrik"]

            for rep in ["verbal", "matematis", "grafis", "visual"]:
                key_obj = db.query(QuestionKey).filter(
                    QuestionKey.question_id == question.id,
                    QuestionKey.representasi == rep
                ).first()

                if not key_obj:
                    key_obj = QuestionKey(
                        question_id=question.id,
                        representasi=rep,
                        kunci_json=kunci_dict.get(rep, {}),
                        rubrik_json=rubrik_dict.get(rep, {})
                    )
                    db.add(key_obj)
            db.commit()
            print("Question keys and rubrics seeded.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_paket()
