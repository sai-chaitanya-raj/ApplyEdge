# ── Frontend Dockerfile (Multi-Stage Build) ──────────────────────────────────
#
# Stage 1: BUILD
# Uses Node to install dependencies and compile the React app into static files
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev — needed for build)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Accept backend URL as a build-time argument (required for Render — two separate services)
# Local Docker: not needed (Nginx proxies /api/* to the backend container)
# Render: set REACT_APP_API_URL=https://applyedge-backend.onrender.com in Render dashboard
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app — if REACT_APP_API_URL is set it gets baked into the bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: SERVE
# Takes only the compiled /build output — the Node.js image is thrown away
# Final image is ~25MB (just Nginx Alpine + static files)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy React build output into Nginx's serve directory
COPY --from=builder /app/build /usr/share/nginx/html

# SPA-only nginx config (Render: API via REACT_APP_API_URL, not nginx proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
