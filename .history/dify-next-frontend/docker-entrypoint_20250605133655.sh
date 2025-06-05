#!/bin/sh
set -e

# Run Prisma migration to ensure DB schema is up-to-date
npx prisma migrate deploy

# Start Next.js app
npm run start
