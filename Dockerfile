# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build the client and server for production
# This command is from your package.json
RUN npm run build

# Make your app's port available to the outside world
EXPOSE 5000

# The command to run your app
# This command is from your package.json
CMD [ "npm", "run", "start" ]
