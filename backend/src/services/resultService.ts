import mongoose from 'mongoose';
import { Result, IResult } from '../models/Result';
import { Exam } from '../models/Exam';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';

export const gradeSingleQuestion = async (
  resultId: string,
  questionId: string,
  marksEarned: number,
  feedback: string | undefined,
  adminUserId: string
) => {
  const result = await Result.findById(resultId);
  if (!result) throw new Error('Result record not found');

  const qRes = result.questionResults.find((q) => q.questionId === questionId);
  if (!qRes) throw new Error('Question result not found in this submission');

  const oldMarks = qRes.marksEarned;
  qRes.marksEarned = marksEarned;
  qRes.status = marksEarned > 0 ? 'correct' : 'incorrect';
  qRes.feedback = feedback;
  qRes.gradedBy = new mongoose.Types.ObjectId(adminUserId);
  qRes.gradedAt = new Date();

  // Recalculate totals
  let newTotal = 0;
  let pendingCount = 0;

  for (const q of result.questionResults) {
    if (q.status === 'pending_manual') {
      pendingCount++;
    } else {
      newTotal += q.marksEarned;
    }
  }

  result.totalMarksEarned = Math.max(0, Number(newTotal.toFixed(2)));
  result.percentage = Number(((result.totalMarksEarned / result.maxMarks) * 100).toFixed(2));

  const exam = await Exam.findById(result.examId);
  if (exam) {
    result.passed = result.totalMarksEarned >= exam.passingMarks;
    if (exam.resultVisibility === 'after_manual_grading' && pendingCount === 0) {
      result.releasedToStudent = true;
    }
  }

  result.pendingManualGradingCount = pendingCount;
  result.isGradingComplete = pendingCount === 0;

  result.markModified('questionResults');
  await result.save();

  // Log Audit
  const adminUser = await User.findById(adminUserId);
  const audit = new AuditLog({
    action: 'MANUAL_GRADE_QUESTION',
    performedBy: new mongoose.Types.ObjectId(adminUserId),
    userEmail: adminUser?.email || 'admin@batchflow.local',
    targetRef: `Result:${resultId}`,
    details: { questionId, oldMarks, newMarks: marksEarned, feedback }
  });
  await audit.save();

  return result;
};

export const setExamResultReleaseStatus = async (
  examId: string,
  released: boolean,
  adminUserId: string
) => {
  await Result.updateMany({ examId }, { $set: { releasedToStudent: released } });

  const adminUser = await User.findById(adminUserId);
  const audit = new AuditLog({
    action: released ? 'RELEASE_EXAM_RESULTS' : 'HIDE_EXAM_RESULTS',
    performedBy: new mongoose.Types.ObjectId(adminUserId),
    userEmail: adminUser?.email || 'admin@batchflow.local',
    targetRef: `Exam:${examId}`,
    details: { released }
  });
  await audit.save();
};

export const getExamResultsAdmin = async (examId: string) => {
  const results = await Result.find({ examId })
    .populate('studentId', 'name email studentId')
    .sort({ totalMarksEarned: -1 });

  return results;
};

export const exportExamResultsCSV = async (examId: string): Promise<string> => {
  const exam = await Exam.findById(examId);
  const results = await Result.find({ examId }).populate('studentId', 'name email studentId');

  const headers = [
    'Student Name',
    'Email',
    'Student ID',
    'Marks Earned',
    'Total Marks',
    'Percentage',
    'Pass Status',
    'Grading Complete',
    'Evaluated At'
  ];

  const rows = results.map((r: any) => [
    `"${r.studentId?.name || 'N/A'}"`,
    `"${r.normalizedEmail}"`,
    `"${r.studentId?.studentId || 'N/A'}"`,
    r.totalMarksEarned,
    r.maxMarks,
    `${r.percentage}%`,
    r.passed ? 'PASSED' : 'FAILED',
    r.isGradingComplete ? 'Yes' : 'No',
    `"${new Date(r.evaluatedAt).toISOString()}"`
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const getStudentResultView = async (examId: string, studentUser: any) => {
  const result = await Result.findOne({ examId, studentId: studentUser._id });
  if (!result) return null;

  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  if (!result.releasedToStudent) {
    return {
      isReleased: false,
      message: 'Results for this examination have not been released by the examiner yet.'
    };
  }

  if (exam.resultVisibility === 'marks_only') {
    return {
      isReleased: true,
      examTitle: exam.title,
      totalMarksEarned: result.totalMarksEarned,
      maxMarks: result.maxMarks,
      percentage: result.percentage,
      passed: result.passed,
      isGradingComplete: result.isGradingComplete
    };
  }

  // Full results with answers
  return {
    isReleased: true,
    examTitle: exam.title,
    totalMarksEarned: result.totalMarksEarned,
    maxMarks: result.maxMarks,
    percentage: result.percentage,
    passed: result.passed,
    isGradingComplete: result.isGradingComplete,
    questionResults: result.questionResults
  };
};
