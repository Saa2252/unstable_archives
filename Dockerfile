FROM node:20-alpine

LABEL maintainer="Unstable Archives Project"

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the site
RUN npm run build

# Expose port for development server
EXPOSE 8080

# Default command to serve the site
CMD ["npm", "run", "serve"]
