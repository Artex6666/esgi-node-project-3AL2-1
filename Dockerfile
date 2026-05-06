# syntax=docker/dockerfile:1.7

FROM node:25-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:25-alpine AS runtime
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
