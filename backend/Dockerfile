# backend/Dockerfile
FROM node:20-slim
WORKDIR /app

# Copy package.json first for caching
COPY package*.json ./
RUN npm install --only=production

# Copy all other application files
COPY . .

# Ensure the app listens on the correct port
EXPOSE 5000 
USER node

CMD [ "node", "server.js" ]