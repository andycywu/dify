#!/bin/bash

echo "Creating a simplified Docker solution..."

# Create a simple Dockerfile without complex styling dependencies
cat > /Users/andycyw/dify/dify-next-frontend/Dockerfile.simple << 'EOL'
# Dify Next Frontend Dockerfile - Simplified
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy app source
COPY . .

# Build Next.js app with standard configuration
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/src ./src

EXPOSE 3100
CMD ["npm","run","start"]
EOL

# Update the Button component to use regular CSS classes instead of CSS-in-JS
cat > /Users/andycyw/dify/dify-next-frontend/src/components/UI/Button.tsx << 'EOL'
import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

// Using standard CSS classes from global stylesheets
const Button: React.FC<ButtonProps> = ({ children, className = "", ...props }) => (
  <button 
    className={`btn-primary ${className}`} 
    {...props}
  >
    {children}
  </button>
);

export default Button;
EOL

# Add button styles to global CSS
cat >> /Users/andycyw/dify/dify-next-frontend/src/styles/globals.css << 'EOL'

/* Button styles */
.btn-primary {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  cursor: pointer;
  border: none;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:focus {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}
EOL

echo "Creating minimal Next.js config..."
cat > /Users/andycyw/dify/dify-next-frontend/next.config.js << 'EOL'
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000/api',
  },
  i18n,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
}

module.exports = nextConfig;
EOL

echo "Applying simple solution..."
mv /Users/andycyw/dify/dify-next-frontend/Dockerfile.simple /Users/andycyw/dify/dify-next-frontend/Dockerfile

echo "Rebuilding Docker container..."
cd /Users/andycyw/dify
docker-compose -f docker/docker-compose.yaml down dify-next-frontend
docker-compose -f docker/docker-compose.yaml build dify-next-frontend
docker-compose -f docker/docker-compose.yaml up -d dify-next-frontend

echo "Setup complete! The frontend should now be accessible with proper styling using simple CSS classes."
