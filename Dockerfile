# ==============================================================================
# SentinelX / THERMO-SHIELD AI — Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || true

# --- Stage 2: Python FastAPI Master Backend ---
FROM python:3.13-slim
WORKDIR /app

# Set system environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install essential system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and database files
COPY . .

# Copy built frontend assets if generated
COPY --from=frontend-builder /app/dist ./dist

# Create non-root user for security
RUN useradd -m -u 1001 sentineluser && chown -R sentineluser:sentineluser /app
USER sentineluser

# Expose FastAPI Master Service Port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI Master Backend with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
