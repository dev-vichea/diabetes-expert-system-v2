# syntax=docker/dockerfile:1

# ── Base Stage: Python 3.12 with WeasyPrint C-Libraries & Khmer Fonts ──
FROM python:3.12-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install native dependencies required by WeasyPrint (Pango, Cairo, Harfbuzz, libffi)
# and open-source Khmer & Unicode fonts for bilingual PDF generation.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libjpeg62-turbo \
    libopenjp2-7 \
    libffi8 \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-khmeros \
    fonts-dejavu-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# ── Development Stage (Hot-reloading with mounted volume) ──
FROM base AS development

ENV FLASK_DEBUG=1 \
    FLASK_APP="app:create_app()"

COPY . .

EXPOSE 5001

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5001"]

# ── Production Stage (Non-root user + Gunicorn WSGI server) ──
FROM base AS production

ENV FLASK_DEBUG=0

# Create non-root system user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser

# Copy application source
COPY --chown=appuser:appgroup . .

# Ensure instance directory exists and is writable for potential fallback
RUN mkdir -p /app/instance && chown -R appuser:appgroup /app/instance

USER appuser

ENV PORT=5001
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5001}/health || exit 1

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 4 --threads 2 --timeout 90 --access-logfile - --error-logfile - 'app:create_app()'"]
