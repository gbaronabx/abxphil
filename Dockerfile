# Multi-stage Dockerfile for Vite React app, ready for Railway
# 1) Build the static site
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (use ci for reproducible builds)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# 2) Run a tiny static server that respects $PORT
FROM node:20-alpine AS runner
WORKDIR /app

# Install a zero-config static file server
RUN npm i -g serve@14
ENV NODE_ENV=production
# Default to 8080; Railway will inject PORT
ENV PORT=8080
EXPOSE 8080

# Copy only the production build output
COPY --from=build /app/dist ./dist

# Use shell form so ${PORT} is expanded; bind explicitly to 0.0.0.0 for Docker
CMD sh -c "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"

