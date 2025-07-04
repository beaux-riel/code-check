import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import auditRoutes from './routes/auditRoutes';
import { initializeWebSocketServer } from './websocket/websocketServer';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file
dotenv.config();

// Create a new Prisma Client instance
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocketServer({ server });
initializeWebSocketServer(wss, prisma);

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/audits', auditRoutes(prisma));

// Error handling middleware (must be after routes)
app.use('*', notFoundHandler);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
