#!/bin/sh
set -e

# Ensure the data directory exists
mkdir -p /app/data

# Check if database exists and needs initialization
if [ ! -f /app/data/dev.db ]; then
  echo "Database not found at /app/data/dev.db. Initializing database..."
  
  # Run Prisma migrations to create the schema
  npx prisma migrate deploy
  
  # Seed the database with initial admin user if needed
  if [ -f /app/prisma/seed.cjs ]; then
    echo "Seeding database with initial data..."
    node /app/prisma/seed.cjs || echo "Warning: Database seeding encountered issues, continuing..."
  fi
  
  echo "Database initialization complete."
else
  echo "Database found at /app/data/dev.db. Running migrations..."
  # Run migrations to ensure DB schema is up-to-date
  npx prisma migrate deploy || echo "Warning: Migration encountered issues, continuing..."
fi

# Verify database is accessible
if [ -f /app/data/dev.db ]; then
  echo "Database file verified at /app/data/dev.db"
  ls -lh /app/data/dev.db
else
  echo "ERROR: Database file not found after initialization!"
  exit 1
fi

echo "Starting Next.js application..."
# Start Next.js app
npm run start
