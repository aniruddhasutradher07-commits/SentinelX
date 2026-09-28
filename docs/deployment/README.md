# HeatGuard AI — Deployment & Infrastructure Guide

HeatGuard AI is designed for resilient, cross-platform deployment spanning local development environments, self-hosted Docker containers, Kubernetes clusters, and cloud application platforms (Railway / Render).

---

## 🌐 Live Cloud Deployment

- **Production API & Web Application:**  
  **`https://sentinelx-thermal-api-production-aa42.up.railway.app`**
- **Hosting Platform:** Railway Cloud
- **Runtime Environment:** Containerized Linux (Python 3.12 + Node.js 20 multi-stage container)
- **SSL / TLS:** Managed HTTPS termination via Railway Edge

---

## 🐳 Docker Deployment

The repository includes a production-grade multi-stage `Dockerfile`:

### 1. Build the Docker Image
```bash
docker build -t heatguard-ai:latest .
```

### 2. Run the Container
```bash
docker run -d \
  --name heatguard-ai \
  -p 8000:8000 \
  -e PORT=8000 \
  -e APP_ENV=production \
  heatguard-ai:latest
```

### 3. Verify Health Status
```bash
curl -f http://localhost:8000/health
```

---

## 💻 Local Reproducible Setup

### System Prerequisites
- **Python:** 3.11 or 3.12+
- **Node.js:** v18+ or v20+
- **Git**

### Step-by-Step Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/aniruddhasutradher07-commits/SentinelX.git
   cd SentinelX
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

3. **Backend Setup:**
   ```bash
   # Create and activate virtual environment
   python3 -m venv .venv
   source .venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Frontend Setup:**
   ```bash
   npm install
   ```

5. **Running Locally:**
   - **Full Stack Development Server (Vite + Express):**
     ```bash
     npm run dev
     # Opens at http://localhost:3000
     ```
   - **FastAPI Backend Server:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port 8000 --reload
     # Opens at http://localhost:8000 (Docs at http://localhost:8000/docs)
     ```
   - **Production Build:**
     ```bash
     npm run build
     npm start
     ```
