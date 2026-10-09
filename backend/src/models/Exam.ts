import mongoose, { Schema, Document } from 'mongoose';
import { IQuestion } from './QuestionBank';

export type ExamStatus =
  | 'draft'
  | 'awaiting_assignment'
  | 'ready_to_publish'
  | 'scheduled'
  | 'active'
  | 'closed'
  | 'archived';

export type ResultVisibilityPolicy =
  | 'hidden'
  | 'marks_only'
  | 'full_with_answers'
  | 'after_manual_grading';

export interface IDifficultyConfig {
  mode: 'exact' | 'percentage';
  easy: number; // count or percentage
  medium: number;
  hard: number;
}

export interface IQuestionTypeConfig {
  mcq: number;
  msq: number;
  true_false: number;
  short_answer: number;
  predict_output: number;
  write_code: number;
  code_output: number;
}

export interface IExam extends Document {
  title: string;
  subject: string;
  description?: string;
  instructions?: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled: boolean;
  defaultNegativeMarks: number;
  maxAttempts: number;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  resultVisibility: ResultVisibilityPolicy;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  status: ExamStatus;
  isPublished: boolean;
  selectedTopics: string[];
  difficultyConfig: IDifficultyConfig;
  questionTypeConfig: IQuestionTypeConfig;
  questionsSnapshot: any[]; // Embedded copy of questions
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String },
    instructions: { type: String },
    totalQuestions: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    negativeMarkingEnabled: { type: Boolean, default: false },
    defaultNegativeMarks: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timeZone: { type: String, default: 'UTC' },
    resultVisibility: {
      type: String,
      enum: ['hidden', 'marks_only', 'full_with_answers', 'after_manual_grading'],
      default: 'after_manual_grading'
    },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        'draft',
        'awaiting_assignment',
        'ready_to_publish',
        'scheduled',
        'active',
        'closed',
        'archived'
      ],
      default: 'draft'
    },
    isPublished: { type: Boolean, default: false },
    selectedTopics: [{ type: String }],
    difficultyConfig: {
      mode: { type: String, enum: ['exact', 'percentage'], default: 'exact' },
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    },
    questionTypeConfig: {
      mcq: { type: Number, default: 0 },
      msq: { type: Number, default: 0 },
      true_false: { type: Number, default: 0 },
      short_answer: { type: Number, default: 0 },
      predict_output: { type: Number, default: 0 },
      write_code: { type: Number, default: 0 },
      code_output: { type: Number, default: 0 }
    },
    questionsSnapshot: [{ type: Schema.Types.Mixed }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

ExamSchema.index({ status: 1, startDate: 1, endDate: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
