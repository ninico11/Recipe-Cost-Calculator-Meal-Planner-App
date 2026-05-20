# Recipe Cost Calculator & Meal Planner App

Small full-stack laboratory project with:

- `FastAPI` backend
- `React + Vite` frontend
- `SQLite` for local storage
- `Docker Compose` for local containers
- `Kubernetes` manifests for local cluster deployment

Main features:

- ingredients CRUD
- recipe creation
- recipe total cost calculation
- cost per serving
- weekly meal planner

## Project structure

```text
Recipe-Cost-Calculator-Meal-Planner-App/
  backend/
  frontend/
  k8s/
  docker-compose.yml
  README.md
```

## Prerequisites

Install and make sure these commands work in terminal:

- `python`
- `npm.cmd`
- `docker`
- `kubectl`

If you use Docker Desktop Kubernetes, make sure the cluster is enabled and running.

## Local development

Run backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Backend URLs:

- app: `http://127.0.0.1:8000`
- health: `http://127.0.0.1:8000/health`

Run frontend in a second terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL:

- `http://127.0.0.1:5173`

## Local Docker development

Build and run:

```powershell
docker compose up --build
```

Open:

- `http://127.0.0.1:8080`

Stop:

```powershell
docker compose down
```

Run in background:

```powershell
docker compose up -d --build
```

See running containers:

```powershell
docker compose ps
```

See logs:

```powershell
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

Rebuild after code changes:

```powershell
docker compose build
docker compose up -d
```

Force clean rebuild:

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
```

Remove containers, network, and volume:

```powershell
docker compose down -v
```

## Docker image commands

Build images manually with the same names used by Kubernetes:

```powershell
docker build -t recipe-meal-backend:latest .\backend
docker build -t recipe-meal-frontend:latest --build-arg VITE_API_URL=/api .\frontend
```

List images:

```powershell
docker images
```

Remove app images:

```powershell
docker rmi recipe-meal-backend:latest
docker rmi recipe-meal-frontend:latest
```

## Database notes

Local development uses:

- `backend/meal_planner.db`

Docker Compose uses:

- named volume `backend-data`

Kubernetes uses:

- PVC `backend-data-pvc`

## Kubernetes

Kubernetes instructions are in [k8s/README.md](/c:/Users/Ion/Desktop/Labs/AC/Recipe-Cost-Calculator-Meal-Planner-App/k8s/README.md:1).

## Common workflow

Typical dev flow:

1. run locally with Python + Vite
2. test in Docker with `docker compose up --build`
3. rebuild tagged images
4. deploy to Kubernetes

## Troubleshooting

If frontend cannot call backend in local dev:

- check backend is running on `8000`
- check frontend is running on `5173`
- check `http://127.0.0.1:8000/health`

If Docker app does not open:

- run `docker compose ps`
- run `docker compose logs -f`

If Kubernetes pod shows image errors:

- rebuild the tagged images
- restart the deployments
- read [k8s/README.md](/c:/Users/Ion/Desktop/Labs/AC/Recipe-Cost-Calculator-Meal-Planner-App/k8s/README.md:1)
