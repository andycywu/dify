# Troubleshooting Guide: 401 Authentication Error

## Problem Description
When trying to log in at `http://localhost:3001/login`, the authentication fails with:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## Root Causes

### 1. Missing Environment Configuration
The Docker container expects a `.env.aws` file that was not present in the repository.

### 2. Database Path Mismatch
The database path was inconsistent across different configuration files:
- Docker compose set: `DATABASE_URL="file:/app/data/dev.db"`
- Prisma client defaulted to: `file:/app/dev.db`
- Volume mount: `/app/data`

### 3. Missing Volume Directory
The Docker volume directory `./volumes/dify-next-frontend/` was not initialized.

### 4. Database Not Seeded
The SQLite database was not being properly initialized with an admin user on first run.

## Solutions Applied

### 1. Created `.env.aws` File
Created `/dify-next-frontend/.env.aws` with proper Docker environment configuration:
- Set correct API URLs pointing to internal Docker network (`http://api:5001`)
- Set proper authentication URLs
- Configured database path: `file:/app/data/dev.db`
- Added default admin credentials

### 2. Fixed Database Path Consistency
Updated `lib/prisma.js` and `prisma/seed.cjs` to use consistent database path:
```javascript
url: process.env.DATABASE_URL || "file:/app/data/dev.db"
```

### 3. Enhanced Docker Entrypoint
Updated `docker-entrypoint.sh` to:
- Create `/app/data` directory if it doesn't exist
- Check if database exists before running migrations
- Run database seeding on first initialization
- Add proper error handling and logging
- Verify database file exists before starting the app

### 4. Created Volume Initialization Script
Created `docker/init-volumes.sh` to set up the required volume directories before starting containers.

## How to Fix

### Step 1: Initialize Volumes
```bash
cd docker
./init-volumes.sh
```

### Step 2: Rebuild the Frontend Container
```bash
docker-compose build dify-next-frontend
```

### Step 3: Start the Services
```bash
docker-compose up -d
```

### Step 4: Verify Database Initialization
```bash
# Check container logs
docker-compose logs dify-next-frontend

# Verify database file exists
docker-compose exec dify-next-frontend ls -lh /app/data/dev.db

# Check database tables
docker-compose exec dify-next-frontend sh -c "cd /app && npx prisma studio --browser none"
```

### Step 5: Test Login
1. Navigate to: `http://localhost:3001/login`
2. Use credentials:
   - Email: `admin@example.com`
   - Password: `dify12345`

## Verification Steps

### 1. Check Container Status
```bash
docker-compose ps dify-next-frontend
```

### 2. Check Database in Container
```bash
# Enter container
docker-compose exec dify-next-frontend sh

# Check if database exists
ls -lh /app/data/dev.db

# Check database content (if sqlite3 is available)
sqlite3 /app/data/dev.db "SELECT * FROM User;"
```

### 3. Check Environment Variables
```bash
docker-compose exec dify-next-frontend env | grep -E "(DATABASE_URL|NEXTAUTH)"
```

### 4. Test API Endpoints
```bash
# Test if the frontend API is responding
curl http://localhost:3001/api/health

# Test authentication endpoint (should return method not allowed for GET)
curl -v http://localhost:3001/api/auth/callback/credentials
```

## Common Issues and Solutions

### Issue: Database file not found
**Solution:** Ensure the volume directory exists and has proper permissions:
```bash
cd docker
mkdir -p volumes/dify-next-frontend
chmod 755 volumes/dify-next-frontend
```

### Issue: Migration fails
**Solution:** Remove the database and restart:
```bash
docker-compose down
rm -f docker/volumes/dify-next-frontend/dev.db
docker-compose up -d dify-next-frontend
```

### Issue: Still getting 401 after login
**Possible causes:**
1. Wrong credentials (use `admin@example.com` / `dify12345`)
2. Database not seeded (check logs for "Seeding database")
3. Session/cookie issues (clear browser cache and cookies)
4. NEXTAUTH_SECRET or NEXTAUTH_URL misconfigured

**Solution:** Check logs and verify database:
```bash
# Check if admin user exists
docker-compose exec dify-next-frontend sh -c "
  cd /app && node -e \"
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.findMany().then(users => {
    console.log('Users in database:', users.length);
    users.forEach(u => console.log('- ' + u.email + ' (' + u.role + ')'));
  }).finally(() => prisma.\\\$disconnect());
  \"
"
```

### Issue: Container keeps restarting
**Solution:** Check container logs for errors:
```bash
docker-compose logs --tail=100 dify-next-frontend
```

## Default Credentials

After successful initialization, you can log in with these default users:

| Email                    | Password    | Role        |
|--------------------------|-------------|-------------|
| admin@example.com        | dify12345   | admin       |
| superadmin@example.com   | dify12345   | super admin |
| user@example.com         | dify12345   | user        |
| admin                    | dify12345   | admin       |

**⚠️ IMPORTANT:** Change these default passwords in a production environment!

## Additional Resources

- NextAuth.js Documentation: https://next-auth.js.org/
- Prisma Documentation: https://www.prisma.io/docs/
- Docker Volumes: https://docs.docker.com/storage/volumes/

## Need More Help?

If you're still experiencing issues:
1. Check the container logs: `docker-compose logs -f dify-next-frontend`
2. Verify all services are running: `docker-compose ps`
3. Check network connectivity between containers
4. Review the ARCHITECTURE.md file for system overview
