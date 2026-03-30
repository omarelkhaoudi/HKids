# Étape 1 : Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

# Étape 2 : Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app /app
RUN mkdir -p /app/uploads_data
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]