# lexify-api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Only copy root package files to install dependencies
COPY package*.json ./
COPY apps/lexify-api/package*.json ./apps/lexify-api/
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY apps/lexify-api ./apps/lexify-api

# Build the application
RUN npm run build -w apps/lexify-api

# --- runner stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built assets and required modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/lexify-api/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# The startup command is defined in docker-compose.yml 
# (which applies migrations before starting node dist/main)
CMD ["node", "dist/main"]
