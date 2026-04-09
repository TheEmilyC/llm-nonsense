FROM node:22-slim

# Build tools required to compile better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install dependencies (cached layer — only re-runs when lockfile changes)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm db-generate

# Build Next.js for production
RUN pnpm build

EXPOSE 3010
ENV NODE_ENV=production
ENV PORT=3010

# Run DB migrations (against the mounted volume) then start the server
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
