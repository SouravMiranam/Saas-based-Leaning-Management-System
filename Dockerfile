# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies (production only for smaller image)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ---------- Stage 2: Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy full source code and node_modules from deps
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the Next.js app
RUN npm run build

# ---------- Stage 3: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy required files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Expose the application port
EXPOSE 3000

# ✅ Run in production mode, bound to 0.0.0.0 (needed for App Runner)
CMD ["npm", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
