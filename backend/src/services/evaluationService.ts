import mongoose from 'mongoose';
import { ExamAttempt } from '../models/ExamAttempt';
import { Exam } from '../models/Exam';
import { Result, ISingleQuestionResult } from '../models/Result';

export const evaluateAttempt = async (attemptId: string) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error('Exam attempt not found');

  const exam = await Exam.findById(attempt.examId);
  if (!exam) throw new Error('Associated exam not found');

  // Check if result already exists for this attempt
  let result = await Result.findOne({ attemptId: attempt._id });
  if (!result) {
    result = new Result({
      examId: exam._id,
      attemptId: attempt._id,
      studentId: attempt.studentId,
      normalizedEmail: attempt.normalizedEmail,
      maxMarks: exam.totalMarks,
      questionResults: []
    });
  }

  let totalEarned = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let pendingManualCount = 0;

  const questionResults: ISingleQuestionResult[] = [];

  for (const q of exam.questionsSnapshot) {
    const questionId = q.questionId;
    const maxMarks = q.marks || 1;
    const negMarks = exam.negativeMarkingEnabled ? (q.negativeMarks ?? exam.defaultNegativeMarks ?? 0) : 0;
    const studentAnsObj = attempt.answers.get(questionId);

    if (!studentAnsObj) {
      unansweredCount++;
      questionResults.push({
        questionId,
        questionType: q.questionType,
        maxMarks,
        marksEarned: 0,
        status: 'unanswered',
        studentResponse: null,
        correctAnswerKey: q.correctAnswers,
        explanation: q.explanation
      });
      continue;
    }

    let marks = 0;
    let status: 'correct' | 'incorrect' | 'unanswered' | 'pending_manual' = 'incorrect';

    switch (q.questionType) {
      case 'mcq': {
        const sel = studentAnsObj.selectedOptions?.[0];
        if (!sel) {
          status = 'unanswered';
          unansweredCount++;
        } else if (q.correctAnswers.includes(sel)) {
          marks = maxMarks;
          status = 'correct';
          correctCount++;
        } else {
          marks = -negMarks;
          status = 'incorrect';
          incorrectCount++;
        }
        break;
      }

      case 'msq': {
        const selected = studentAnsObj.selectedOptions || [];
        if (selected.length === 0) {
          status = 'unanswered';
          unansweredCount++;
        } else {
          const correctSet = new Set(q.correctAnswers);
          const hasIncorrect = selected.some((opt) => !correctSet.has(opt));

          if (hasIncorrect) {
            marks = -negMarks;
            status = 'incorrect';
            incorrectCount++;
          } else {
            const correctSelected = selected.filter((opt) => correctSet.has(opt));
            if (correctSelected.length === q.correctAnswers.length) {
              marks = maxMarks;
              status = 'correct';
              correctCount++;
            } else {
              // Partial credit proportional
              marks = Number(((correctSelected.length / q.correctAnswers.length) * maxMarks).toFixed(2));
              status = 'correct';
              correctCount++;
            }
          }
        }
        break;
      }

      case 'true_false': {
        const sel = studentAnsObj.selectedOptions?.[0];
        if (!sel) {
          status = 'unanswered';
          unansweredCount++;
        } else if (
          q.correctAnswers.map((a: string) => a.toLowerCase()).includes(sel.toLowerCase())
        ) {
          marks = maxMarks;
          status = 'correct';
          correctCount++;
        } else {
          marks = -negMarks;
          status = 'incorrect';
          incorrectCount++;
        }
        break;
      }

      case 'predict_output': {
        const studentOut = (studentAnsObj.outputAnswer || studentAnsObj.textAnswer || '').trim();
        if (!studentOut) {
          status = 'unanswered';
          unansweredCount++;
        } else {
          const matched = q.correctAnswers.some(
            (key: string) => key.trim().toLowerCase() === studentOut.toLowerCase()
          );
          if (matched) {
            marks = maxMarks;
            status = 'correct';
            correctCount++;
          } else {
            marks = -negMarks;
            status = 'incorrect';
            incorrectCount++;
          }
        }
        break;
      }

      case 'short_answer': {
        const txt = (studentAnsObj.textAnswer || '').trim();
        if (!txt) {
          status = 'unanswered';
          unansweredCount++;
        } else {
          // Check exact match first
          const exactMatch = q.correctAnswers.some(
            (key: string) => key.trim().toLowerCase() === txt.toLowerCase()
          );
          if (exactMatch) {
            marks = maxMarks;
            status = 'correct';
            correctCount++;
          } else {
            status = 'pending_manual';
            pendingManualCount++;
          }
        }
        break;
      }

      case 'write_code':
      case 'code_output': {
        const code = (studentAnsObj.codeAnswer || studentAnsObj.textAnswer || '').trim();
        if (!code) {
          status = 'unanswered';
          unansweredCount++;
        } else {
          status = 'pending_manual';
          pendingManualCount++;
        }
        break;
      }

      default: {
        status = 'pending_manual';
        pendingManualCount++;
        break;
      }
    }

    totalEarned += marks;

    questionResults.push({
      questionId,
      questionType: q.questionType,
      maxMarks,
      marksEarned: marks,
      status,
      studentResponse: studentAnsObj,
      correctAnswerKey: q.correctAnswers,
      explanation: q.explanation
    });
  }

  const finalScore = Math.max(0, Number(totalEarned.toFixed(2)));
  const percentage = Number(((finalScore / exam.totalMarks) * 100).toFixed(2));
  const passed = finalScore >= exam.passingMarks;

  result.totalMarksEarned = finalScore;
  result.maxMarks = exam.totalMarks;
  result.percentage = percentage;
  result.passed = passed;
  result.correctCount = correctCount;
  result.incorrectCount = incorrectCount;
  result.unansweredCount = unansweredCount;
  result.pendingManualGradingCount = pendingManualCount;
  result.isGradingComplete = pendingManualCount === 0;
  result.questionResults = questionResults;

  // Auto-release policy check
  if (exam.resultVisibility === 'full_with_answers' || exam.resultVisibility === 'marks_only') {
    result.releasedToStudent = true;
  } else if (exam.resultVisibility === 'after_manual_grading' && result.isGradingComplete) {
    result.releasedToStudent = true;
  } else {
    result.releasedToStudent = false;
  }

  result.evaluatedAt = new Date();
  await result.save();
  return result;
};
