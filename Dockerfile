FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=3000 STORAGE=postgres
EXPOSE 3000
CMD ["sh", "-c", "node backend/init-postgres.mjs && node backend/server.mjs"]
