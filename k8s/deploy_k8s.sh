#!/usr/bin/env bash
# ==============================================================================
# SentinelX Sovereign Pan-India Platform — Kubernetes Production Deployment Script
# ==============================================================================
set -euo pipefail

echo "🛡️ Deploying SentinelX / THERMO-SHIELD AI to Kubernetes Cluster..."

# Create disaster-management namespace if not present
kubectl get namespace disaster-management >/dev/null 2>&1 || kubectl create namespace disaster-management

# Apply ConfigMaps & Secrets
echo "📦 Applying ConfigMaps & Secrets..."
kubectl apply -f k8s/sentinelx-configmap.yaml

# Apply Deployment, HPA, and Service
echo "⚡ Applying Deployment, Autoscaler & Service..."
kubectl apply -f k8s/sentinelx-hpa.yaml

# Apply Ingress
echo "🌐 Applying Ingress & TLS Rules..."
kubectl apply -f k8s/sentinelx-ingress.yaml

echo "✅ SentinelX Pan-India Sovereign Platform deployed successfully to disaster-management namespace!"
echo "Check pods with: kubectl get pods -n disaster-management -l app=sentinelx"
