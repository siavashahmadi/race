# ---- Stage 1: Install dependencies ----
# We use a "multi-stage" build. Think of it like cooking:
# Stage 1 = prep (install everything)
# Stage 2 = plate (copy only what we need into a clean image)
# This keeps the final image small.

FROM node:20-slim AS deps

WORKDIR /app

# Copy only package files first. Docker caches layers — if these files
# haven't changed, Docker skips `npm ci` on rebuild (saves minutes).
COPY package.json package-lock.json ./

# `npm ci` = clean install. Unlike `npm install`, it uses the lockfile
# exactly, so builds are reproducible.
RUN npm ci


# ---- Stage 2: Build the Next.js app ----
FROM node:20-slim AS builder

WORKDIR /app

# Copy node_modules from Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Now copy the rest of your source code
COPY . .

# Build the production Next.js bundle
RUN npm run build


# ---- Stage 3: Production runtime ----
# This is the image that actually runs. We start fresh and only copy
# what's needed — no devDependencies, no source TypeScript files.
FROM node:20-slim AS runner

WORKDIR /app

# Puppeteer needs Chromium, which needs these Linux system libraries.
# Without them, Chromium crashes on launch inside the container.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system-installed Chromium instead of
# downloading its own (~400MB savings).
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Don't run as root in production (security best practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the built app from Stage 2
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js production server
CMD ["node", "server.js"]
