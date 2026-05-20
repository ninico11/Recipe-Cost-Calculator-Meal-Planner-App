# Use a Node image for the build stage where the React app is compiled.
FROM node:24-alpine AS build

# Set the working directory for the frontend build process.
WORKDIR /app

# Define the API URL that Vite will bake into the production build.
ARG VITE_API_URL=/api

# Expose that build argument as an environment variable during the build.
ENV VITE_API_URL=$VITE_API_URL

# Copy the package manifest files first so dependency installation can be cached.
COPY package*.json ./

# Install the frontend dependencies in a clean reproducible way.
RUN npm ci

# Copy the rest of the frontend source code into the build container.
COPY . .

# Build the production-ready static frontend files.
RUN npm run build

# Use a small Nginx image to serve the built frontend files.
FROM nginx:1.27-alpine

# Copy the custom Nginx config that serves React and proxies API requests.
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built frontend files from the build stage into the Nginx web root.
COPY --from=build /app/dist /usr/share/nginx/html

# Tell Docker that the frontend container serves traffic on port 80.
EXPOSE 80

# Start Nginx in the foreground so the container keeps running.
CMD ["nginx", "-g", "daemon off;"]
