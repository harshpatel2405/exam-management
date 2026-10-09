import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import questionBankRoutes from './routes/questionBankRoutes';
import examRoutes from './routes/examRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import attemptRoutes from './routes/attemptRoutes';
import gradingRoutes from './routes/gradingRoutes';
import resultRoutes from './routes/resultRoutes';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://exam-management-beige.vercel.app'
];

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BatchFlow Examination System API', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/results', resultRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
