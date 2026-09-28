# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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
