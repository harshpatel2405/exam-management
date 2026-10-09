import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { verifyExamEmailAccess } from '../middleware/emailAccess';
import {
  createExamFromWizard,
  getAdminExamPreview,
  getStudentExamPreview,
  replaceExamQuestion,
  publishExam,
  validateExamForPublication
} from '../services/examService';
import { assignStudentsToExam } from '../services/assignmentService';
import { Exam } from '../models/Exam';
import { ExamAssignment } from '../models/ExamAssignment';

const router = Router();

router.use(authenticate);

// Student Endpoint: List assigned exams
router.get('/student/my-exams', requireRole('student'), async (req: AuthRequest, res) => {
  try {
    const studentEmail = req.user!.normalizedEmail;

    // Find all active assignments for student
    const assignments = await ExamAssignment.find({
      normalizedEmail: studentEmail,
      status: 'assigned'
    });

    const examIds = assignments.map((a) => a.examId);
    const exams = await Exam.find({
      _id: { $in: examIds },
      isPublished: true
    }).sort({ startDate: 1 });

    const now = new Date();

    const categorized = exams.map((exam) => {
      let availabilityStatus = 'available';
      if (now < new Date(exam.startDate)) {
        availabilityStatus = 'upcoming';
      } else if (now > new Date(exam.endDate)) {
        availabilityStatus = 'closed';
      }

      return {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        description: exam.description,
        totalQuestions: exam.totalQuestions,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        startDate: exam.startDate,
        endDate: exam.endDate,
        availabilityStatus
      };
    });

    return res.json({ success: true, data: categorized });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student Endpoint: Get Exam Instructions Briefing (Strict Email Check)
router.get(
  '/:examId/student-instructions',
  requireRole('student'),
  verifyExamEmailAccess,
  async (req: AuthRequest, res) => {
    try {
      const exam = await Exam.findById(req.params.examId);
      if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
      const instructions = getStudentExamPreview(exam);
      return res.json({ success: true, data: instructions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Admin Exam Management Routes
router.post('/wizard', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { initialAssignments, ...wizardInput } = req.body;
    const exam = await createExamFromWizard(wizardInput, req.user!._id.toString());

    // Step 6 optional initial student assignment during creation
    let assignmentResult = null;
    if (initialAssignments) {
      assignmentResult = await assignStudentsToExam(
        exam._id.toString(),
        initialAssignments,
        req.user!._id.toString()
      );
    } else {
      exam.status = 'awaiting_assignment';
      await exam.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Exam generated and saved successfully',
      data: { exam, assignmentResult }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: exams });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:examId', requireRole('admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    return res.json({ success: true, data: exam });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:examId/admin-preview', requireRole('admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const preview = getAdminExamPreview(exam);
    return res.json({ success: true, data: preview });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:examId/student-preview', requireRole('admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const preview = getStudentExamPreview(exam);
    return res.json({ success: true, data: preview });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:examId/replace-question', requireRole('admin'), async (req, res) => {
  try {
    const { oldQuestionId, newQuestionId } = req.body;
    const exam = await replaceExamQuestion(req.params.examId, oldQuestionId, newQuestionId);
    return res.json({ success: true, message: 'Question replaced in exam snapshot', data: exam });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:examId/publish', requireRole('admin'), async (req, res) => {
  try {
    const exam = await publishExam(req.params.examId);
    return res.json({ success: true, message: 'Exam published successfully', data: exam });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
