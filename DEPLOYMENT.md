# 🚀 SentinelX / THERMO-SHIELD AI — Cloud Deployment & Containerization Guide

This guide details how to deploy SentinelX across **Docker**, **Render**, **Railway**, **Google Cloud Run**, **AWS**, and **Vercel**.

---

## 🏗️ Architecture Overview

```
                                  ┌─────────────────────────────────────────┐
                                  │      Cloud Load Balancer / CDN (SSL)    │
                                  └────────────────────┬────────────────────┘
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           │                                                       │
             ┌─────────────┴──────────────┐                         ┌──────────────┴─────────────┐
             │    FastAPI Master Backend  │                         │   Static Command Centers   │
             │   (Port 8000 / Cloud Run)  │                         │   (Odisha / Ward Bento UI) │
             ├────────────────────────────┤                         ├────────────────────────────┤
             │ • /docs (OpenAPI Swagger)  │                         │ • /dashboard/odisha        │
             │ • /api/v1/live-feed        │                         │ • /dashboard/bhubaneswar   │
             │ • /api/v1/news/heatwave    │                         │ • Vercel / Netlify Edge    │
             │ • /api/v1/alerts/broadcast │                         └────────────────────────────┘
             │ • 2-Stage DLNM+XGBoost ML  │
             └────────────────────────────┘
```

---

## 🐳 Option 1: Docker & Docker Compose (Recommended)

### 1. Build and Run with Docker:
```bash
# Build the Docker image
docker build -t sentinelx-ai .

# Run container on port 8000
docker run -d -p 8000:8000 --name sentinelx sentinelx-ai
```

### 2. Run with Docker Compose:
```bash
docker compose up --build -d
```

Check health:
```bash
curl http://localhost:8000/health
```

---

## ☁️ Option 2: Render (1-Click Cloud Deployment)

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add Docker and Cloud deployment configurations"
   git push origin main
   ```
2. Go to **[Render.com](https://render.com/)** -> Click **New +** -> **Web Service**.
3. Connect your GitHub repository `SentinelX`.
4. Configure settings:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: `AIzaSyDR9BlDJxO2z4RQEUcqGH4W9sE2E28S5d4`
   - `NEWS_API_KEY`: `ae6b26e8512d4fb8a6d5a917923908f6`
   - `WEATHERAPI_KEY`: `34b0083b19ed408b8ad65436263008`
6. Click **Deploy Web Service** — Your API and Dashboards will be live on a public `https://sentinelx.onrender.com` URL!

---

## ⚡ Option 3: Google Cloud Run (Serverless Container)

### 1. Authenticate with Google Cloud:
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### 2. Build and Deploy directly to Cloud Run:
```bash
gcloud run deploy sentinelx \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars="NEWS_API_KEY=ae6b26e8512d4fb8a6d5a917923908f6,WEATHERAPI_KEY=34b0083b19ed408b8ad65436263008"
```

---

## 🌐 Option 4: AWS EC2 / Lightsail Deployment

### 1. SSH into your Ubuntu EC2 / Lightsail instance:
```bash
ssh -i key.pem ubuntu@YOUR_SERVER_IP
```

### 2. Setup Environment & Clone:
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv git
git clone https://github.com/aniruddhasutradher07-commits/SentinelX.git
cd SentinelX
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run with systemd or PM2 as a background service:
```bash
sudo npm install -g pm2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name sentinelx
pm2 save
pm2 startup
```

---

## 📐 Option 5: Vercel (Edge UI Deployment)

To deploy the interactive dashboards as static edge pages on Vercel:
```bash
npm install -g vercel
vercel deploy --prod
```

---

## 🛡️ Production Verification Checklist

- [ ] **Health Endpoint:** `GET /health` returns `200 OK`
- [ ] **Swagger UI:** `GET /docs` interactive API explorer loads
- [ ] **Odisha Bento Dashboard:** `GET /dashboard/odisha` loads with Leaflet map
- [ ] **NewsAPI Wire:** `GET /api/v1/news/heatwave` returns live news articles
- [ ] **Emergency Broadcast:** `POST /api/v1/alerts/simulate-red-alert` executes drill
