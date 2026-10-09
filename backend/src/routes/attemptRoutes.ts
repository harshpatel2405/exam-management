import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { verifyExamEmailAccess } from '../middleware/emailAccess';
import {
  startExamAttempt,
  saveStudentAnswer,
  submitExamAttempt
} from '../services/attemptService';

const router = Router();

router.use(authenticate);

// 1. Start Exam Attempt - STRICT EMAIL ACCESS VERIFICATION ENFORCED
router.post(
  '/:examId/start',
  requireRole('student'),
  verifyExamEmailAccess,
  async (req: AuthRequest, res) => {
    try {
      const examId = req.params.examId;
      const result = await startExamAttempt(examId, req.user!);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
);

// 2. Save Answer - Checks student owns attempt
router.post('/:attemptId/save-answer', requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const attemptId = req.params.attemptId;
    const answerData = req.body;
    const attempt = await saveStudentAnswer(attemptId, req.user!._id.toString(), answerData);
    return res.json({ success: true, message: 'Answer persisted', data: { status: attempt.status } });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Submit Exam - Checks student owns attempt
router.post('/:attemptId/submit', requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const attemptId = req.params.attemptId;
    const isAutoSubmit = req.body.isAutoSubmit === true;
    const result = await submitExamAttempt(attemptId, req.user!._id.toString(), isAutoSubmit);
    return res.json({
      success: true,
      message: 'Exam submitted and evaluated successfully',
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
