# Troubleshooting Guide

## Common Issues and Solutions

### Frontend Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Problem**: The web frontend displays an error about invalid JSON when trying to connect to the API.

**Cause**: This error occurs when the frontend expects JSON from the backend API but receives an HTML page instead, usually because:

- The API backend server is not running
- The backend is running on a different port than expected
- Network connectivity issues

**Solution**:

1. **Start the API Backend**:

   ```bash
   cd packages/api-backend
   npm start
   ```

   The backend should start on port 3001.

2. **Verify Backend is Running**:

   ```bash
   curl http://localhost:3001/api/health
   ```

   You should see: `{"status":"ok","timestamp":"..."}`

3. **Use the Development Startup Script**:

   ```bash
   npm run start:dev
   ```

   This script automatically starts both the backend and frontend with proper initialization.

4. **Check Port Configuration**:
   - Backend should run on port 3001 (check `packages/api-backend/.env`)
   - Frontend expects backend on port 3001 (check `packages/web-app/src/services/api.ts`)

### Connection Status Indicator

The web dashboard includes a connection status indicator in the header that shows:

- 🟢 Connected: Backend API is accessible
- 🔴 Disconnected: Cannot reach backend API

### Database Issues

If you encounter database-related errors:

1. **Initialize/Reset Database**:

   ```bash
   cd packages/api-backend
   npx prisma generate
   npx prisma db push
   ```

2. **Check Database File**:
   The SQLite database file should be created at `packages/api-backend/prisma/dev.db`

### Port Conflicts

If you get port already in use errors:

1. **Check what's using the port**:

   ```bash
   lsof -i :3001  # Check port 3001
   lsof -i :3000  # Check port 3000
   ```

2. **Kill existing processes**:

   ```bash
   kill -9 <PID>
   ```

3. **Change ports** (if needed):
   - Backend: Edit `packages/api-backend/.env` and change `PORT=3001`
   - Frontend: Edit `packages/web-app/src/services/api.ts` and update `API_BASE_URL`

### Build Issues

If packages fail to build:

1. **Clean and reinstall**:

   ```bash
   npm run clean
   npm install
   npm run build
   ```

2. **Individual package builds**:
   ```bash
   cd packages/core-engine && npm run build
   cd packages/shared && npm run build
   cd packages/api-backend && npm run build
   cd packages/web-app && npm run build
   ```

### TypeScript Errors

1. **Regenerate types**:

   ```bash
   cd packages/api-backend
   npx prisma generate
   ```

2. **Check TypeScript configuration**:
   ```bash
   npm run typecheck
   ```

## Getting Help

1. **Check the connection status** in the web dashboard header
2. **Inspect browser console** for detailed error messages
3. **Check backend logs** in the terminal where you started the API server
4. **Verify all required services** are running:
   - Backend API (port 3001)
   - Frontend dev server (port 3000)
   - Database is initialized

## Quick Start Command

For the fastest setup, use:

```bash
npm run start:dev
```

This command will:

- Install dependencies if needed
- Build all packages
- Initialize the database
- Start the backend API server
- Start the frontend development server
- Verify everything is working

The script will show you the URLs for both services and handle graceful shutdown when you press Ctrl+C.
