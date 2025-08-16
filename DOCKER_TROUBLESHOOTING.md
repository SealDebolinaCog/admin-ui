# Docker Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Hub Rate Limiting (403 Forbidden)

**Error:** `failed to copy: httpReadSeeker: failed open: unexpected status code https://registry-1.docker.io/v2/library/node/blobs/...: 403 Forbidden`

**Solutions:**

#### Option 1: Use Retry Commands
```bash
# Use the retry build command
make build-retry

# Or use the complete rebuild with retry
make all
```

#### Option 2: Login to Docker Hub
```bash
# Login to Docker Hub (free account helps with rate limits)
make docker-login

# Then try building again
make build
```

#### Option 3: Pre-pull Base Images
```bash
# Pre-pull base images when you have good connectivity
make pull-base-images

# Then build normally
make build
```

#### Option 4: Wait and Retry
Docker Hub rate limits reset after some time. Wait 10-15 minutes and try again.

### 2. Build Context Too Large

**Error:** `failed to build: context too large`

**Solution:**
```bash
# Clean up unnecessary files
make clean-all

# Check .dockerignore files are properly configured
```

### 3. Port Already in Use

**Error:** `port is already allocated`

**Solutions:**
```bash
# Stop all services first
make stop

# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :80

# Kill processes if needed, then restart
make dev
```

### 4. Container Won't Start

**Solutions:**
```bash
# Check container status
make status

# View logs for debugging
make logs

# Check specific service logs
make logs-backend
make logs-frontend-dev
```

### 5. Volume Mount Issues

**Error:** Files not updating in development mode

**Solutions:**
```bash
# Clean volumes and rebuild
make clean
make dev

# Check if volumes are mounted correctly
docker-compose ps
```

## Useful Debugging Commands

```bash
# Show help with all available commands
make help

# Check Docker system info
make docker-info

# List all Docker images
make docker-images

# Check service health
make health

# View container status
make status

# Access container shell
make shell-backend
make shell-frontend
```

## Performance Tips

1. **Use Docker Desktop Settings:**
   - Increase memory allocation (4GB+)
   - Enable file sharing for your project directory

2. **Pre-pull Images:**
   ```bash
   make pull-base-images
   ```

3. **Use Build Cache:**
   - Don't use `--no-cache` unless necessary
   - Keep your Dockerfile layers optimized

4. **Clean Up Regularly:**
   ```bash
   make clean-all
   ```

## Getting Help

If you continue to have issues:

1. Check Docker Desktop is running
2. Verify you have sufficient disk space
3. Try restarting Docker Desktop
4. Check the official Docker documentation
5. Consider using a Docker Hub account to increase rate limits

## Alternative Solutions

If Docker issues persist, you can always fall back to local development:

```bash
# Run locally without Docker
make dev-local

# Or use npm directly
npm install
npm run dev
```
