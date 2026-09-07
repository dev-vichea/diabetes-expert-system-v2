import os
import sys
from dotenv import load_dotenv

workspace_dir = "/Users/kiddd/Documents/MyLearning/Python/diabetes-expert-system-v2"
backend_env = os.path.join(workspace_dir, "backend", ".env")
load_dotenv(backend_env)
sys.path.insert(0, os.path.join(workspace_dir, "backend"))

from app import create_app
from app.extensions import db
from sqlalchemy import text
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED

app = create_app()

with app.app_context():
    print("Updating facts in database...")
    updated = 0
    for f in FACT_CATALOG_SEED:
        key = f.get("key")
        q_km = f.get("question_km")
        if key and q_km:
            result = db.session.execute(
                text("UPDATE facts SET question_km = :q_km WHERE key = :key"),
                {"q_km": q_km, "key": key}
            )
            updated += result.rowcount
    db.session.commit()
    print(f"Successfully updated {updated} facts with question_km in Supabase!")

    # Verify rapid_onset
    row = db.session.execute(text("SELECT key, question, question_km FROM facts WHERE key = 'rapid_onset'")).fetchone()
    if row:
        print("Verification for rapid_onset:")
        print(f"  key: {row[0]}")
        print(f"  EN: {row[1]}")
        print(f"  KM: {row[2]}")
