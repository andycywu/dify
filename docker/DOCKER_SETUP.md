# Docker Deployment Setup

This directory contains the Docker Compose configuration for running the Dify platform with the custom dify-next-frontend.

## Quick Start

### Prerequisites
- Docker 20.10 or later
- Docker Compose 2.0 or later

### Initial Setup

1. **Initialize the environment:**
   ```bash
   cd docker
   ./init-volumes.sh
   ```
   
   This script will:
   - Create the `.env.aws` file from the example template
   - Initialize all required volume directories
   - Set proper permissions

2. **Review and update configuration:**
   ```bash
   # Edit the environment file if needed
   nano ../dify-next-frontend/.env.aws
   ```
   
   Key settings to verify:
   - `NEXTAUTH_SECRET`: Should be a strong random string
   - `NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME`: Default admin email
   - `NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD`: Default admin password (change this!)

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Check logs:**
   ```bash
   # Watch all services
   docker-compose logs -f
   
   # Watch only the frontend
   docker-compose logs -f dify-next-frontend
   ```

5. **Access the application:**
   - Frontend: http://localhost:3001
   - Original Dify Web: http://localhost:80
   - Wiki.js: http://localhost:3002

## Default Login Credentials

After the first startup, you can log in with:

| Email                    | Password    | Role        |
|--------------------------|-------------|-------------|
| admin@example.com        | dify12345   | admin       |
| superadmin@example.com   | dify12345   | super admin |
| user@example.com         | dify12345   | user        |

**⚠️ IMPORTANT:** Change these passwords immediately after first login, especially in production!

## Common Tasks

### Rebuild a Service
```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### Reset the Database
```bash
# Stop the service
docker-compose stop dify-next-frontend

# Remove the database
rm -f volumes/dify-next-frontend/dev.db

# Restart the service (will reinitialize)
docker-compose up -d dify-next-frontend
```

### View Database Contents
```bash
# Enter the container
docker-compose exec dify-next-frontend sh

# Inside the container, check the database
ls -lh /app/data/dev.db

# Use Prisma to inspect (if needed)
npx prisma studio --browser none
```

### Check Container Health
```bash
# List all services
docker-compose ps

# Check specific service logs
docker-compose logs --tail=100 dify-next-frontend

# Check resource usage
docker stats
```

## Troubleshooting

### 401 Authentication Error

If you're getting 401 errors when trying to log in:

1. **Check if the database exists:**
   ```bash
   docker-compose exec dify-next-frontend ls -lh /app/data/dev.db
   ```

2. **Verify database has users:**
   ```bash
   docker-compose exec dify-next-frontend sh -c "
     cd /app && node -e \"
     const { PrismaClient } = require('@prisma/client');
     const prisma = new PrismaClient();
     prisma.user.findMany().then(users => {
       console.log('Users:', users.length);
       users.forEach(u => console.log('- ' + u.email));
     }).finally(() => prisma.\\\$disconnect());
     \"
   "
   ```

3. **Check environment variables:**
   ```bash
   docker-compose exec dify-next-frontend env | grep -E "(DATABASE_URL|NEXTAUTH)"
   ```

4. **Reinitialize the database:**
   ```bash
   docker-compose stop dify-next-frontend
   rm -f volumes/dify-next-frontend/dev.db
   docker-compose up -d dify-next-frontend
   ```

For more detailed troubleshooting, see: `../dify-next-frontend/TROUBLESHOOTING_AUTH.md`

### Service Won't Start

1. **Check logs for errors:**
   ```bash
   docker-compose logs dify-next-frontend
   ```

2. **Verify configuration:**
   ```bash
   docker-compose config
   ```

3. **Check for port conflicts:**
   ```bash
   netstat -tuln | grep -E "3001|5001|3002"
   ```

### Permission Issues

If you encounter permission issues with volumes:

```bash
# Fix permissions
sudo chown -R $USER:$USER volumes/
sudo chmod -R 755 volumes/
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Port 80)                      │
│            Reverse Proxy & Load Balancer                │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │ Dify   │  │ Dify    │  │ Wiki.js  │
    │ Web    │  │ Next    │  │ (3002)   │
    │        │  │Frontend │  │          │
    └────────┘  │ (3001)  │  └──────────┘
                └────┬────┘
                     │
                     ▼
            ┌────────────────┐
            │   Dify API     │
            │   (5001)       │
            └───────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │PostgreSQL│ │ Redis  │ │Weaviate│
    │ (5432) │ │ (6379) │ │Vector DB│
    └────────┘ └────────┘ └────────┘
```

## Volume Directories

- `volumes/app/` - Dify application data
- `volumes/db/` - PostgreSQL database
- `volumes/redis/` - Redis data
- `volumes/dify-next-frontend/` - Frontend SQLite database
- `volumes/weaviate/` - Vector database
- `volumes/sandbox/` - Code sandbox
- `volumes/nginx/` - Nginx logs and temp files

## Environment Variables

Key environment variables for dify-next-frontend (in `.env.aws`):

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | SQLite database path | `file:/app/data/dev.db` |
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3001` |
| `NEXTAUTH_SECRET` | NextAuth encryption key | Random string |
| `API_URL` | Backend API endpoint | `http://api:5001` |
| `NODE_ENV` | Environment mode | `production` |

## Additional Resources

- Main documentation: `../README.md`
- Architecture overview: `../ARCHITECTURE.md`
- Frontend authentication guide: `../dify-next-frontend/TROUBLESHOOTING_AUTH.md`
- Dify official docs: https://docs.dify.ai/

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Review the troubleshooting guide
3. Check the GitHub issues
4. Verify all prerequisites are met
