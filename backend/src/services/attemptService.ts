import mongoose from 'mongoose';
import { ExamAttempt, IExamAttempt } from '../models/ExamAttempt';
import { Exam } from '../models/Exam';
import { evaluateAttempt } from './evaluationService';
import { Result } from '../models/Result';

export const startExamAttempt = async (examId: string, studentUser: any) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  if (!exam.isPublished) {
    throw new Error('Exam is not published');
  }

  const now = new Date();
  if (now < new Date(exam.startDate)) {
    throw new Error('Exam has not started yet');
  }

  if (now > new Date(exam.endDate)) {
    throw new Error('Exam window has closed');
  }

  const normalizedEmail = studentUser.normalizedEmail;

  // Fetch all existing attempts for this student & exam
  const existingAttempts = await ExamAttempt.find({
    examId: exam._id,
    studentId: studentUser._id
  }).sort({ attemptNumber: 1 });

  // Check if there is an active attempt in progress
  const activeAttempt = existingAttempts.find((a) => a.status === 'in_progress');

  if (activeAttempt) {
    // If timer expired while user was away, auto-submit & finalize it
    if (now.getTime() > activeAttempt.expiresAt.getTime()) {
      activeAttempt.status = 'timed_out';
      activeAttempt.submittedAt = activeAttempt.expiresAt;
      await activeAttempt.save();
      await evaluateAttempt(activeAttempt._id.toString());
      // Finalized as timed_out
    } else {
      // Resume current active in-progress attempt
      return { attempt: activeAttempt, exam: prepareStudentExamView(exam) };
    }
  }

  // Calculate finalized/completed attempts AFTER handling any timed_out attempt
  const finalizedAttempts = await ExamAttempt.find({
    examId: exam._id,
    studentId: studentUser._id,
    status: { $ne: 'in_progress' }
  });

  if (finalizedAttempts.length >= exam.maxAttempts) {
    throw new Error(
      `Maximum attempt limit (${exam.maxAttempts}) reached for this examination. You have completed ${finalizedAttempts.length} attempt(s).`
    );
  }

  // Create a BRAND NEW attempt with a fresh timer
  const attemptNumber = finalizedAttempts.length + 1;
  const startTime = new Date();
  const durationMs = exam.durationMinutes * 60 * 1000;
  const calculatedExpiry = new Date(startTime.getTime() + durationMs);
  const expiresAt =
    calculatedExpiry < new Date(exam.endDate) ? calculatedExpiry : new Date(exam.endDate);

  const newAttempt = new ExamAttempt({
    examId: exam._id,
    studentId: studentUser._id,
    normalizedEmail,
    attemptNumber,
    startTime,
    expiresAt,
    status: 'in_progress',
    answers: {}
  });

  await newAttempt.save();

  return { attempt: newAttempt, exam: prepareStudentExamView(exam) };
};

export const prepareStudentExamView = (exam: any) => {
  const sanitize = (q: any) => {
    const { correctAnswers, explanation, testCases, ...studentView } = q;
    return studentView;
  };

  return {
    examId: exam._id,
    title: exam.title,
    subject: exam.subject,
    description: exam.description,
    instructions: exam.instructions,
    totalQuestions: exam.totalQuestions,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    startDate: exam.startDate,
    endDate: exam.endDate,
    questions: exam.questionsSnapshot.map(sanitize)
  };
};

export const saveStudentAnswer = async (
  attemptId: string,
  studentUserId: string,
  answerData: {
    questionId: string;
    selectedOptions?: string[];
    textAnswer?: string;
    codeAnswer?: string;
    outputAnswer?: string;
    isMarkedForReview?: boolean;
  }
) => {
  const attempt = await ExamAttempt.findOne({
    _id: attemptId,
    studentId: studentUserId
  });

  if (!attempt) throw new Error('Exam attempt not found');

  if (attempt.status !== 'in_progress') {
    throw new Error(`Attempt is already ${attempt.status} and cannot be modified`);
  }

  const now = new Date();
  if (now.getTime() > attempt.expiresAt.getTime()) {
    attempt.status = 'timed_out';
    attempt.submittedAt = attempt.expiresAt;
    await attempt.save();
    await evaluateAttempt(attempt._id.toString());
    throw new Error('Exam duration time has expired. Attempt auto-submitted.');
  }

  attempt.answers.set(answerData.questionId, {
    questionId: answerData.questionId,
    selectedOptions: answerData.selectedOptions,
    textAnswer: answerData.textAnswer,
    codeAnswer: answerData.codeAnswer,
    outputAnswer: answerData.outputAnswer,
    isMarkedForReview: answerData.isMarkedForReview ?? false,
    updatedAt: new Date()
  });

  attempt.markModified('answers');
  await attempt.save();
  return attempt;
};

export const submitExamAttempt = async (
  attemptId: string,
  studentUserId: string,
  isAutoSubmit: boolean = false
) => {
  const attempt = await ExamAttempt.findOne({
    _id: attemptId,
    studentId: studentUserId
  });

  if (!attempt) throw new Error('Attempt not found');

  if (attempt.status !== 'in_progress') {
    const existingResult = await Result.findOne({ attemptId: attempt._id });
    return { attempt, result: existingResult };
  }

  attempt.status = isAutoSubmit ? 'auto_submitted' : 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  const result = await evaluateAttempt(attempt._id.toString());

  return { attempt, result };
};
