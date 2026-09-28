# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies.
# Prefer `npm ci` (fast, reproducible from the lockfile); fall back to `npm install`
# so the build still succeeds if package-lock.json is missing or out of sync.
RUN npm ci || npm install

# Copy application files
COPY . .

# Build Next.js application
RUN npm run build

# Expose port (app runs on 3002 — see package.json "start")
EXPOSE 3002

# Set environment
ENV NODE_ENV=production

# Persisted call store lives here (mount a volume at /app/.data to keep calls)
RUN mkdir -p /app/.data

# Start application
CMD ["npm", "start"]
