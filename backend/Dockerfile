# backend/Dockerfile

# Use an official Node.js image as the base (slim version for smaller size)
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# This step is often cached, speeding up rebuilds if only application code changes
COPY package*.json ./

# Install application dependencies
# We use a production install since this is the final environment
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Multer creates an 'uploads' directory; ensure it exists and has correct permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to a non-root user for security best practices
USER node

# Expose the port the app runs on (Express server is set up to listen on this port)
EXPOSE 5000

# Command to run the application
# We use the port environment variable set by Azure App Service (usually 8080)
CMD [ "node", "server.js" ]