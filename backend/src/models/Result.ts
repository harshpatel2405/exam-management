import mongoose, { Schema, Document } from 'mongoose';

export type QuestionGradingStatus = 'correct' | 'incorrect' | 'unanswered' | 'pending_manual';

export interface ISingleQuestionResult {
  questionId: string;
  questionType: string;
  maxMarks: number;
  marksEarned: number;
  status: QuestionGradingStatus;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  studentResponse: any;
  correctAnswerKey?: any;
  explanation?: string;
}

export interface IResult extends Document {
  examId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  normalizedEmail: string;
  totalMarksEarned: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  pendingManualGradingCount: number;
  isGradingComplete: boolean;
  questionResults: ISingleQuestionResult[];
  releasedToStudent: boolean;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SingleQuestionResultSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionType: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    marksEarned: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['correct', 'incorrect', 'unanswered', 'pending_manual'],
      required: true
    },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
    studentResponse: { type: Schema.Types.Mixed },
    correctAnswerKey: { type: Schema.Types.Mixed },
    explanation: { type: String }
  },
  { _id: false }
);

const ResultSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    normalizedEmail: { type: String, required: true, lowercase: true },
    totalMarksEarned: { type: Number, default: 0 },
    maxMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    pendingManualGradingCount: { type: Number, default: 0 },
    isGradingComplete: { type: Boolean, default: false },
    questionResults: [SingleQuestionResultSchema],
    releasedToStudent: { type: Boolean, default: false },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ResultSchema.index({ examId: 1, studentId: 1 });
ResultSchema.index({ normalizedEmail: 1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);
