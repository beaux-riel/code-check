# Code Check Dashboard

A modern React TypeScript dashboard for code analysis and quality management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

From the root of the monorepo:

```bash
pnpm install
```

### Development

Start the development server:

```bash
# From monorepo root
pnpm dev

# Or from this package directory
cd packages/web-app
pnpm dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# From monorepo root
pnpm build

# Or from this package directory
cd packages/web-app
pnpm build
```

## 📁 Project Structure

```
packages/web-app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global styles and themes
├── public/              # Static assets
├── dist/                # Built output (generated)
└── package.json
```

## 🎯 Features

- **Interactive Dashboard**: Real-time code analysis results
- **File Explorer**: Browse and inspect analyzed files
- **Coverage Visualization**: Visual representation of test coverage
- **Performance Metrics**: View runtime performance data
- **Security Insights**: Security vulnerability reports
- **Report Generation**: Export analysis results in multiple formats

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the package root:

```env
# API Configuration
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080

# Feature Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_EXPORT=true

# UI Configuration
VITE_THEME=light
VITE_PAGINATION_SIZE=20
```

### Available Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Start development server with hot reload |
| `pnpm build`      | Build for production                     |
| `pnpm preview`    | Preview production build locally         |
| `pnpm lint`       | Run ESLint                               |
| `pnpm lint:fix`   | Fix ESLint issues automatically          |
| `pnpm typecheck`  | Run TypeScript type checking             |
| `pnpm test`       | Run unit tests                           |
| `pnpm test:watch` | Run tests in watch mode                  |
| `pnpm clean`      | Clean build artifacts                    |

## 🎨 UI Components

### Core Components

- `AnalysisCard`: Display analysis results
- `FileTree`: Interactive file explorer
- `CoverageChart`: Coverage visualization
- `MetricsPanel`: Performance metrics display
- `ReportExporter`: Export functionality

### Usage Example

```tsx
import { AnalysisCard, FileTree } from '@/components';

function Dashboard() {
  return (
    <div className="dashboard">
      <AnalysisCard data={analysisData} />
      <FileTree files={fileData} />
    </div>
  );
}
```

## 🔌 API Integration

The web app connects to the Code Check API for data:

```typescript
// Using the built-in API client
import { apiClient } from '@/utils/api';

// Get analysis results
const results = await apiClient.getAnalysisResults(projectId);

// Upload project for analysis
await apiClient.uploadProject(formData);
```

## 📊 Real-time Updates

The app supports real-time updates via WebSocket:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function LiveResults() {
  const { data, isConnected } = useWebSocket('/analysis-updates');

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests (Cypress)

```bash
# Install Cypress (first time only)
pnpm cypress install

# Run E2E tests
pnpm cypress run

# Open Cypress GUI
pnpm cypress open
```

## 🎯 Performance

### Bundle Analysis

```bash
pnpm build:analyze
```

### Performance Tips

- Use lazy loading for large components
- Implement virtualization for large lists
- Optimize images and assets
- Use React.memo for expensive components

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Change port in vite.config.ts or kill process
lsof -ti:3000 | xargs kill -9
```

**Build failures:**

```bash
# Clear cache and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

**TypeScript errors:**

```bash
# Run type checking
pnpm typecheck
```

### Debug Mode

Set `VITE_DEBUG=true` to enable debug logging.

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

### Static Hosting

The built files in `dist/` can be served by any static hosting service.

## 🤝 Contributing

1. Follow the established component patterns
2. Add tests for new features
3. Update documentation
4. Run `pnpm lint` before committing

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Testing Library](https://testing-library.com)
