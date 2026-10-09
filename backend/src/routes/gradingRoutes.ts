import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { Result } from '../models/Result';
import { gradeSingleQuestion } from '../services/resultService';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/pending', async (req, res) => {
  try {
    const examId = req.query.examId as string;
    const query: any = { isGradingComplete: false };
    if (examId) query.examId = examId;

    const pendingResults = await Result.find(query)
      .populate('studentId', 'name email studentId')
      .populate('examId', 'title subject');

    return res.json({ success: true, data: pendingResults });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/result/:resultId/grade', async (req: AuthRequest, res) => {
  try {
    const { questionId, marksEarned, feedback } = req.body;
    if (!questionId || marksEarned === undefined) {
      return res.status(400).json({ success: false, message: 'Question ID and marksEarned are required' });
    }

    const updatedResult = await gradeSingleQuestion(
      req.params.resultId,
      questionId,
      Number(marksEarned),
      feedback,
      req.user!._id.toString()
    );

    return res.json({
      success: true,
      message: 'Question graded successfully',
      data: updatedResult
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
