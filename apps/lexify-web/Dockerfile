# lexify-web/Dockerfile
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json ./
COPY apps/lexify-web/package*.json ./apps/lexify-web/
RUN npm install

FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js sets telemetry to true by default, disable it for build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the web app
RUN npm run build -w apps/lexify-web

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the build output
COPY --from=builder /app/apps/lexify-web/public ./apps/lexify-web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/lexify-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/lexify-web/.next/static ./apps/lexify-web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/lexify-web/server.js"]
