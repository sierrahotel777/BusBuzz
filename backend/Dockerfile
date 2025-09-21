# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Define the command to run the application
CMD ["node", "server.js"]