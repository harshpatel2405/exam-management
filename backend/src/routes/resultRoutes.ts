import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import {
  getExamResultsAdmin,
  exportExamResultsCSV,
  setExamResultReleaseStatus,
  getStudentResultView
} from '../services/resultService';

const router = Router();

router.use(authenticate);

// Student Result Endpoint
router.get('/exam/:examId/my-result', requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const resultView = await getStudentResultView(req.params.examId, req.user!);
    if (!resultView) {
      return res.status(404).json({ success: false, message: 'No result found for this exam' });
    }
    return res.json({ success: true, data: resultView });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Results Endpoints
router.get('/exam/:examId', requireRole('admin'), async (req, res) => {
  try {
    const results = await getExamResultsAdmin(req.params.examId);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/exam/:examId/export-csv', requireRole('admin'), async (req, res) => {
  try {
    const csvContent = await exportExamResultsCSV(req.params.examId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=exam_results_${req.params.examId}.csv`
    );
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/exam/:examId/release', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { released } = req.body;
    await setExamResultReleaseStatus(
      req.params.examId,
      released === true,
      req.user!._id.toString()
    );
    return res.json({
      success: true,
      message: `Results ${released ? 'released to' : 'hidden from'} students successfully`
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
