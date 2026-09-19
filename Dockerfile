# ==============================================================================
# SentinelX / THERMO-SHIELD AI — Multi-Stage Production Dockerfile
# ==============================================================================

# ==============================================================================
# STAGE 1: Python Build — Compile Python dependencies into wheel cache
# ==============================================================================
FROM python:3.12-slim AS python-builder

WORKDIR /build

# Install build essentials (gcc required for XGBoost, pandas, pythermalcomfort)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# Build wheels into /opt/wheels
RUN pip wheel --no-cache-dir --wheel-dir /opt/wheels -r requirements.txt


# ==============================================================================
# STAGE 2: Runtime — Lean Python application image
# ==============================================================================
FROM python:3.12-slim

WORKDIR /app

# Install runtime-only essentials (curl for healthcheck, libgomp1 for XGBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Copy pre-built Python wheels from builder stage
COPY --from=python-builder /opt/wheels /opt/wheels

COPY requirements.txt ./
RUN pip install --no-cache-dir --no-index --find-links=/opt/wheels -r requirements.txt && rm -rf /opt/wheels

# Copy Python application code
COPY main.py database.py schemas.py models.py ./
COPY routers ./routers
COPY services ./services
COPY scripts ./scripts

# Create required directories
RUN mkdir -p data

# Copy data, GeoJSON, and pre-built HTML dashboards
COPY data/ ./data/
COPY *.geojson ./
COPY *.html ./
COPY *.csv ./

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI Master Backend with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
