# Kubernetes Developer Guide

This folder contains the Kubernetes manifests for the local cluster deployment.

## Files

- `namespace.yaml`
- `backend-pvc.yaml`
- `backend-deployment.yaml`
- `backend-service.yaml`
- `frontend-deployment.yaml`
- `frontend-service.yaml`

## What gets created

- namespace: `recipe-app`
- backend deployment
- backend service
- frontend deployment
- frontend service
- persistent storage claim for SQLite

## Prerequisites

Before applying manifests, make sure:

1. Kubernetes is running in Docker Desktop or Rancher Desktop
2. `kubectl` works
3. the app images exist locally with these exact tags:
   - `recipe-meal-backend:latest`
   - `recipe-meal-frontend:latest`

## Build images for Kubernetes

Build backend:

```powershell
docker build -t recipe-meal-backend:latest .\backend
```

Build frontend:

```powershell
docker build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
```

If you use `containerd` tools directly:

```powershell
nerdctl --namespace k8s.io build -t recipe-meal-backend:latest .\backend
nerdctl --namespace k8s.io build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
```

## First deploy

Apply everything:

```powershell
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\backend-pvc.yaml
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\backend-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
```

Check resources:

```powershell
kubectl get all -n recipe-app
kubectl get pvc -n recipe-app
```

Check pods only:

```powershell
kubectl get pods -n recipe-app
```

## Open the app

First try NodePort:

- `http://127.0.0.1:30080`

If NodePort is not reachable:

```powershell
kubectl port-forward -n recipe-app service/frontend 8080:80
```

Then open:

- `http://127.0.0.1:8080`

## Update after code changes

If you changed backend code:

```powershell
docker build -t recipe-meal-backend:latest .\backend
kubectl rollout restart deployment/backend -n recipe-app
kubectl rollout status deployment/backend -n recipe-app
```

If you changed frontend code:

```powershell
docker build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
kubectl rollout restart deployment/frontend -n recipe-app
kubectl rollout status deployment/frontend -n recipe-app
```

If you changed both:

```powershell
docker build -t recipe-meal-backend:latest .\backend
docker build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
kubectl rollout restart deployment/backend -n recipe-app
kubectl rollout restart deployment/frontend -n recipe-app
kubectl get pods -n recipe-app
```

## Reapply manifests

If you changed YAML files:

```powershell
kubectl apply -f .\k8s\backend-pvc.yaml
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\backend-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
```

## Logs and debugging

Backend logs:

```powershell
kubectl logs -n recipe-app deployment/backend
```

Frontend logs:

```powershell
kubectl logs -n recipe-app deployment/frontend
```

Follow logs live:

```powershell
kubectl logs -f -n recipe-app deployment/backend
kubectl logs -f -n recipe-app deployment/frontend
```

Describe a pod:

```powershell
kubectl describe pod -n recipe-app <pod-name>
```

See services:

```powershell
kubectl get svc -n recipe-app
```

See deployments:

```powershell
kubectl get deployments -n recipe-app
```

## Common fixes

If pod shows `ErrImageNeverPull` or image pull issues:

```powershell
docker build -t recipe-meal-backend:latest .\backend
docker build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
kubectl rollout restart deployment/backend -n recipe-app
kubectl rollout restart deployment/frontend -n recipe-app
```

If pods are stuck and you want a clean restart:

```powershell
kubectl delete namespace recipe-app
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\backend-pvc.yaml
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\backend-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
```

## Remove Kubernetes deployment

Delete the whole app:

```powershell
kubectl delete namespace recipe-app
```
