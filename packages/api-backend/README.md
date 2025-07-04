# CodeCheck API Backend

Express.js API backend that wraps the CodeCheck core engine with REST/WebSocket endpoints for launching audits, streaming progress, and retrieving historical results.

## Features

- **REST API**: Create, start, cancel, and monitor code audits
- **WebSocket Support**: Real-time progress streaming during audits
- **Database Storage**: SQLite/PostgreSQL with Prisma ORM for storing audit results
- **Historical Data**: Query past audits, issues, and file analysis results
- **Project Management**: Track projects and their audit history

## Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database:**

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Build the project:**

   ```bash
   pnpm run build
   ```

5. **Start the server:**
   ```bash
   pnpm run dev  # Development mode with hot reload
   # or
   pnpm start    # Production mode
   ```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Audits

- `POST /api/audits` - Create a new audit
- `POST /api/audits/:auditId/start` - Start an audit
- `POST /api/audits/:auditId/cancel` - Cancel a running audit
- `GET /api/audits/:auditId` - Get audit details
- `GET /api/audits/:auditId/status` - Get audit status
- `GET /api/audits` - List audits with pagination and filtering
- `GET /api/audits/:auditId/issues` - Get audit issues
- `GET /api/audits/:auditId/files` - Get audit file results
- `PATCH /api/audits/:auditId` - Update audit status
- `DELETE /api/audits/:auditId` - Delete an audit

### Projects

- `GET /api/audits/projects` - List all projects with metadata

## WebSocket Connection

Connect to `ws://localhost:3000` to receive real-time audit progress updates:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
    case 'audit.progress':
      console.log(`Audit ${message.data.auditId}: ${message.data.progress}%`);
      break;
    case 'audit.completed':
      console.log(`Audit ${message.data.auditId} completed`);
      break;
    case 'audit.error':
      console.error(
        `Audit ${message.data.auditId} failed:`,
        message.data.error
      );
      break;
  }
});
```

## Example Usage

### Creating and Starting an Audit

```bash
# Create an audit
curl -X POST http://localhost:3000/api/audits \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/path/to/your/project",
    "projectName": "My Project",
    "enabledPlugins": ["eslint", "typescript"],
    "rulesets": ["recommended"]
  }'

# Response: { "success": true, "data": { "auditId": "abc123" } }

# Start the audit
curl -X POST http://localhost:3000/api/audits/abc123/start

# Get audit status
curl http://localhost:3000/api/audits/abc123/status
```

### Request Schema for Creating Audits

```typescript
{
  projectPath: string;           // Required: Path to the project
  projectName?: string;          // Optional: Project name
  projectDescription?: string;   // Optional: Project description
  repositoryUrl?: string;        // Optional: Repository URL
  includedFiles?: string[];      // Optional: Files to include
  excludedFiles?: string[];      // Optional: Files to exclude
  includePatterns?: string[];    // Optional: Include patterns
  excludePatterns?: string[];    // Optional: Exclude patterns
  enabledPlugins?: string[];     // Optional: Plugins to enable
  rulesets?: string[];          // Optional: Rulesets to use
  maxWorkers?: number;          // Optional: Max worker threads
  concurrency?: number;         // Optional: Concurrency level
  enableParallelExecution?: boolean; // Optional: Enable parallel execution
  outputFormat?: string;        // Optional: Output format
  generateReports?: boolean;    // Optional: Generate reports
  maxFileSize?: number;         // Optional: Max file size to process
  timeout?: number;             // Optional: Timeout in milliseconds
  bail?: boolean;               // Optional: Stop on first error
  cache?: boolean;              // Optional: Enable caching
}
```

## Database Schema

The API uses Prisma with the following main models:

- **Project**: Represents a code project
- **Audit**: An audit run on a project
- **AuditFile**: Individual files analyzed in an audit
- **Issue**: Code issues found during analysis
- **AuditLog**: Audit execution logs

## Development

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run lint` - Run ESLint
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run test` - Run tests (if configured)

## Configuration

Environment variables (see `.env.example`):

- `DATABASE_URL` - Database connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS origin for web clients
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `LOG_LEVEL` - Logging level

## Architecture

The API backend consists of:

1. **Express Server** (`src/index.ts`) - Main server setup with middleware
2. **Routes** (`src/routes/`) - REST API endpoint definitions
3. **Services** (`src/services/`) - Business logic and core engine integration
4. **WebSocket Server** (`src/websocket/`) - Real-time progress streaming
5. **Middleware** (`src/middleware/`) - Error handling and validation
6. **Types** (`src/types/`) - TypeScript type definitions
7. **Database** (`prisma/`) - Database schema and migrations

The service layer wraps the CodeCheck core engine and provides a clean interface for the REST API while managing audit lifecycle, progress tracking, and result storage.
