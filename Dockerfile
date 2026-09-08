FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production PORT=3000 STORAGE=postgres
ENV DEI_FIXTURES=backend/fixtures/production-empty.json
EXPOSE 3000
CMD ["sh", "-c", "node backend/init-production-postgres.mjs && node backend/production-server.mjs"]
