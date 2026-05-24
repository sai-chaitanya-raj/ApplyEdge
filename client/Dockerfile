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

# Build the React app into /app/build
# No REACT_APP_ env vars needed — API calls use relative /api path
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

# Copy our custom Nginx config template (handles SPA routing + dynamic /api proxy)
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
