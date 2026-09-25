"""Configure test imports without loading local credentials or database settings."""
import os
import sys
from pathlib import Path

os.environ.setdefault("FLASK_DEBUG", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent))
