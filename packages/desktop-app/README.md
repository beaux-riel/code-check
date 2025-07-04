# CodeCheck Desktop

CodeCheck Desktop is an Electron-based desktop application that provides offline usage of the CodeCheck code analysis platform with embedded backend services and local AI model support via Ollama.

## Features

- **Offline Operation**: Fully functional without internet connection
- **Embedded Backend**: Built-in Express server for API functionality
- **Local AI Models**: Ollama integration for offline AI-powered code analysis
- **Automatic Updates**: Built-in updater for seamless app updates
- **Cross-Platform**: Available for Windows, macOS, and Linux

## Architecture

The desktop app consists of:

1. **Main Process** (`src/main/`):
   - Electron main process
   - Backend server management
   - Ollama service management
   - Auto-updater logic
   - IPC handlers

2. **Renderer Process** (`src/renderer/`):
   - React-based UI
   - Same components as web app with desktop enhancements
   - Electron API integration
   - Settings and model management

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm
- Ollama (optional, for AI features)

### Setup

```bash
# Install dependencies
npm install

# Development mode (starts both main and renderer)
npm run electron:dev

# Build for development
npm run build

# Build for production
npm run dist
```

### Build Commands

- `npm run build:main` - Build main process
- `npm run build:renderer` - Build renderer process
- `npm run build` - Build both processes
- `npm run dist` - Create distribution packages
- `npm run dist:mac` - Build for macOS
- `npm run dist:win` - Build for Windows
- `npm run dist:linux` - Build for Linux

## Features

### Backend Manager

Automatically starts and manages an embedded Express server that provides:

- REST API for code audits
- WebSocket connections for real-time updates
- File processing and analysis
- Database management (SQLite)

### Ollama Integration

Provides local AI model management:

- Automatic Ollama installation detection
- Model download and management
- Integration with code analysis plugins
- Offline AI-powered code suggestions

### Settings Management

Desktop-specific settings:

- Auto-start on system boot
- System tray integration
- Update preferences
- Logging configuration
- Custom backend URL support

## Distribution

The app is built using electron-builder and supports:

- **macOS**: DMG and ZIP packages with code signing
- **Windows**: NSIS installer and portable exe
- **Linux**: AppImage and tar.gz packages

### Code Signing

For production builds, configure code signing:

1. **macOS**: Configure Developer ID certificates
2. **Windows**: Configure Authenticode certificates

### Auto Updates

The app includes automatic update functionality:

- GitHub Releases integration
- Background update downloads
- User notification and restart prompts

## Security

- Content Security Policy (CSP) configured
- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication

## File Structure

```
src/
├── main/                 # Main process
│   ├── main.ts          # Entry point
│   ├── preload.ts       # Preload script
│   ├── backend-manager.ts # Backend server management
│   ├── ollama-manager.ts  # Ollama service management
│   └── menu-builder.ts   # Application menu
└── renderer/            # Renderer process
    ├── components/      # React components
    ├── pages/          # Application pages
    ├── hooks/          # React hooks
    ├── services/       # API services
    └── types/          # TypeScript types
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Test on multiple platforms

## License

Same as the main CodeCheck project.
