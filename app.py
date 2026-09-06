import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment if present
ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "backend" / ".env")

# Add backend directory to sys.path
backend_dir = ROOT_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Evict wrapper app.py from sys.modules so the real backend/app package loads
if "app" in sys.modules:
    del sys.modules["app"]

import app as real_app

# Expose both 'app' and 'create_app' directly on the 'app' module
flask_instance = real_app.create_app()
real_app.app = flask_instance
setattr(sys.modules["app"], "app", flask_instance)

app = flask_instance
create_app = real_app.create_app
