import mongoose, { Schema, Document } from 'mongoose';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType =
  | 'mcq'
  | 'msq'
  | 'true_false'
  | 'short_answer'
  | 'predict_output'
  | 'write_code'
  | 'code_output';

export interface IQuestion extends Document {
  questionId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswers: string[]; // Always store as array of strings for consistent handling
  explanation?: string;
  marks: number;
  negativeMarks: number;
  codeSnippet?: string;
  expectedOutput?: string;
  sampleInput?: string;
  sampleOutput?: string;
  testCases?: { input: string; output: string; isHidden?: boolean }[];
  tags?: string[];
  bankId?: mongoose.Types.ObjectId;
}

const QuestionSchema: Schema = new Schema(
  {
    questionId: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    subtopic: { type: String, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questionType: {
      type: String,
      enum: [
        'mcq',
        'msq',
        'true_false',
        'short_answer',
        'predict_output',
        'write_code',
        'code_output'
      ],
      required: true
    },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswers: [{ type: String, required: true }],
    explanation: { type: String },
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, required: true, default: 0 },
    codeSnippet: { type: String },
    expectedOutput: { type: String },
    sampleInput: { type: String },
    sampleOutput: { type: String },
    testCases: [
      {
        input: { type: String },
        output: { type: String },
        isHidden: { type: Boolean, default: false }
      }
    ],
    tags: [{ type: String }],
    bankId: { type: Schema.Types.ObjectId, ref: 'QuestionBank' }
  },
  { timestamps: true }
);

QuestionSchema.index({ subject: 1, topic: 1, difficulty: 1, questionType: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

export interface IQuestionBank extends Document {
  title: string;
  subject: string;
  description?: string;
  questionCount: number;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionBankSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String },
    questionCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);
