import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import {
  importQuestionBankJSON,
  getQuestions,
  getTopicsForSubject
} from '../services/questionBankService';
import { QuestionBank, Question } from '../models/QuestionBank';

const router = Router();

router.use(authenticate);

// Admin-only question bank operations
router.post('/import', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { title, subject, description, questions } = req.body;
    if (!title || !subject || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Invalid question bank import payload' });
    }

    const result = await importQuestionBankJSON(
      title,
      subject,
      description,
      questions,
      req.user!._id.toString()
    );

    return res.status(201).json({
      success: true,
      message: `Successfully imported question bank "${title}" with ${result.createdQuestionsCount} questions`,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/banks', requireRole('admin'), async (req, res) => {
  try {
    const banks = await QuestionBank.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: banks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/questions', requireRole('admin'), async (req, res) => {
  try {
    const subject = req.query.subject as string;
    const difficulty = req.query.difficulty as string;
    const questionType = req.query.questionType as string;
    const search = req.query.search as string;
    const bankId = req.query.bankId as string;
    const topics = req.query.topics ? (req.query.topics as string).split(',') : undefined;

    const questions = await getQuestions({
      subject,
      difficulty,
      questionType,
      search,
      bankId,
      topics
    });

    return res.json({ success: true, data: questions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/topics', requireRole('admin'), async (req, res) => {
  try {
    const subject = req.query.subject as string;
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject parameter is required' });
    }
    const topics = await getTopicsForSubject(subject);
    return res.json({ success: true, data: topics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
