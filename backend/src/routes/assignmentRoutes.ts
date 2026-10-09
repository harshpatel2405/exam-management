import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import {
  assignStudentsToExam,
  revokeStudentAssignment,
  getExamAssignments
} from '../services/assignmentService';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.post('/:examId/assign', async (req: AuthRequest, res) => {
  try {
    const examId = req.params.examId;
    const assignmentInput = req.body; // { emails, studentIds, groups, csvContent, sendNotifications }
    const result = await assignStudentsToExam(examId, assignmentInput, req.user!._id.toString());
    return res.json({
      success: true,
      message: `Assigned ${result.assigned.length} students. ${result.duplicates.length} duplicates skipped.`,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:examId', async (req, res) => {
  try {
    const assignments = await getExamAssignments(req.params.examId);
    return res.json({ success: true, data: assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:examId/revoke', async (req: AuthRequest, res) => {
  try {
    const { email, reason } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Student email is required for revocation' });
    }

    const assignment = await revokeStudentAssignment(
      req.params.examId,
      email,
      req.user!._id.toString(),
      reason
    );
    return res.json({
      success: true,
      message: `Access revoked for ${email}`,
      data: assignment
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
