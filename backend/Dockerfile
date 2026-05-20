# Use a small official Python image as the base for the backend container.
FROM python:3.12-slim

# Set the working directory inside the container where app files will live.
WORKDIR /app

# Prevent Python from writing `.pyc` files inside the container.
ENV PYTHONDONTWRITEBYTECODE=1

# Force Python logs to be printed directly so container logs stay readable.
ENV PYTHONUNBUFFERED=1

# Define the database file path to a mounted data directory for persistence.
ENV DB_PATH=/data/meal_planner.db

# Create the data directory that will store the SQLite database file.
RUN mkdir -p /data

# Copy the Python dependency list into the image first for better Docker caching.
COPY requirements.txt ./

# Install the Python dependencies needed by FastAPI and Uvicorn.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application source code into the container.
COPY app ./app

# Tell Docker that the backend listens on port 8000.
EXPOSE 8000

# Start the FastAPI application with Uvicorn and listen on all network interfaces.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
