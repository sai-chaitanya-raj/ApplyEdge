# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Node 20 Alpine is small (~180MB) and production-safe
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (layer caching — only re-installs if these change)
COPY package*.json ./

# Install only production dependencies (no devDependencies like nodemon)
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY src/ ./src/

# Create the uploads directory so multer can write temp PDF files
RUN mkdir -p /app/uploads

# Expose the port Express listens on
EXPOSE 5000

# Health check — Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "src/index.js"]
