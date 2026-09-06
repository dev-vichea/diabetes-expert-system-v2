import os
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Attempt to load local environment files if present
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(BACKEND_DIR / ".env")
except ImportError:
    pass

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app

app = create_app()
