import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ExamAssignment } from '../models/ExamAssignment';
import { Exam } from '../models/Exam';

export const verifyExamEmailAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Admins bypass student assignment checks
    if (req.user.role === 'admin') {
      return next();
    }

    const examId = req.params.examId || req.body.examId || (req.query.examId as string);
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Exam ID is required for access verification' });
    }

    const normalizedEmail = req.user.normalizedEmail;
    if (!normalizedEmail) {
      return res.status(403).json({ success: false, message: 'Authenticated user email is missing' });
    }

    // 1. Fetch Exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (!exam.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Exam is not published and unavailable for students'
      });
    }

    // 2. Strict explicit assignment check on database
    const assignment = await ExamAssignment.findOne({
      examId,
      normalizedEmail
    });

    if (!assignment || assignment.status !== 'assigned') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your email address is not explicitly authorized for this examination'
      });
    }

    // 3. Time Availability window check
    const now = new Date();
    if (now < new Date(exam.startDate)) {
      return res.status(403).json({
        success: false,
        message: `Exam has not started yet. Available from ${exam.startDate.toISOString()}`
      });
    }

    if (now > new Date(exam.endDate)) {
      return res.status(403).json({
        success: false,
        message: `Exam window has closed on ${exam.endDate.toISOString()}`
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error verifying exam access' });
  }
};
