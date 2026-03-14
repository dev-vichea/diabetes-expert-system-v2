from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Shared extension instances initialized in app factory.
db = SQLAlchemy()
migrate = Migrate()
