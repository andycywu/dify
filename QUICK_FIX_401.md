# Quick Fix Guide for 401 Authentication Error

## Problem
Getting `401 Unauthorized` error when trying to log in at `http://localhost:3001/login`

## Quick Solution

Run these commands in order:

```bash
# Step 1: Initialize environment and volumes
cd docker
./init-volumes.sh

# Step 2: Rebuild the frontend container
docker-compose build dify-next-frontend

# Step 3: Start the services
docker-compose up -d dify-next-frontend

# Step 4: Check logs to verify initialization
docker-compose logs -f dify-next-frontend
# Wait for "Database initialization complete" and "Ready on http://0.0.0.0:3000"
# Press Ctrl+C to exit logs

# Step 5: Login
# Navigate to: http://localhost:3001/login
# Use credentials:
#   Email: admin@example.com
#   Password: dify12345
```

## What This Fixes

The script and rebuild will:
1. ✅ Create the missing `.env.aws` configuration file
2. ✅ Initialize the database volume directory
3. ✅ Set up the SQLite database with proper schema
4. ✅ Seed the database with default admin users
5. ✅ Fix path consistency issues between Docker and Prisma

## Default Login Credentials

| Email                  | Password  | Role        |
|------------------------|-----------|-------------|
| admin@example.com      | dify12345 | admin       |
| superadmin@example.com | dify12345 | super admin |
| user@example.com       | dify12345 | user        |

**⚠️ Change these passwords after first login!**

## Still Having Issues?

### Check Database Initialization

```bash
# Verify database file exists
docker-compose exec dify-next-frontend ls -lh /app/data/dev.db

# Check how many users are in the database
docker-compose exec dify-next-frontend sh -c "
  cd /app && node -e \"
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.findMany().then(users => {
    console.log('Total users:', users.length);
    users.forEach(u => console.log('- ' + u.email + ' (' + u.role + ')'));
  }).finally(() => prisma.\\\$disconnect());
  \"
"
```

### Reset Everything

If problems persist, reset the database:

```bash
# Stop the service
docker-compose stop dify-next-frontend

# Remove the database
rm -f docker/volumes/dify-next-frontend/dev.db

# Restart (will reinitialize)
docker-compose up -d dify-next-frontend

# Watch logs
docker-compose logs -f dify-next-frontend
```

## More Information

- **Detailed Setup Guide**: [docker/DOCKER_SETUP.md](docker/DOCKER_SETUP.md)
- **Troubleshooting Guide**: [dify-next-frontend/TROUBLESHOOTING_AUTH.md](dify-next-frontend/TROUBLESHOOTING_AUTH.md)
- **Architecture Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)

## Understanding the Issue

The 401 error was caused by:
1. Missing `.env.aws` file that Docker container expected
2. Database path inconsistencies between configuration files
3. Missing database volume directory
4. Database not being seeded with initial users

All these issues have been fixed with the changes committed in this PR.
