import mongoose, { Schema, Document } from 'mongoose';

export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'timed_out';

export interface IQuestionAnswer {
  questionId: string;
  selectedOptions?: string[];
  textAnswer?: string;
  codeAnswer?: string;
  outputAnswer?: string;
  isMarkedForReview?: boolean;
  updatedAt?: Date;
}

export interface IExamAttempt extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  normalizedEmail: string;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  expiresAt: Date;
  answers: Map<string, IQuestionAnswer>;
  status: AttemptStatus;
  submittedAt?: Date;
  clientIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    selectedOptions: [{ type: String }],
    textAnswer: { type: String },
    codeAnswer: { type: String },
    outputAnswer: { type: String },
    isMarkedForReview: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ExamAttemptSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    normalizedEmail: { type: String, required: true, lowercase: true },
    attemptNumber: { type: Number, default: 1 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    expiresAt: { type: Date, required: true },
    answers: { type: Map, of: QuestionAnswerSchema, default: {} },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'timed_out'],
      default: 'in_progress'
    },
    submittedAt: { type: Date },
    clientIp: { type: String }
  },
  { timestamps: true }
);

ExamAttemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 });
ExamAttemptSchema.index({ normalizedEmail: 1, examId: 1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
