import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'student']).optional().default('student'),
  studentId: z.string().optional(),
  groups: z.array(z.string()).optional()
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const QuestionSchemaZod = z.object({
  questionId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionType: z.enum([
    'mcq',
    'msq',
    'true_false',
    'short_answer',
    'predict_output',
    'write_code',
    'code_output'
  ]),
  questionText: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswers: z.array(z.string()).min(1, 'At least one correct answer required'),
  explanation: z.string().optional(),
  marks: z.number().positive().default(1),
  negativeMarks: z.number().nonnegative().default(0),
  codeSnippet: z.string().optional(),
  expectedOutput: z.string().optional(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const QuestionBankImportSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(QuestionSchemaZod).min(1, 'Question bank must contain at least 1 question')
});

export const ExamWizardSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  totalQuestions: z.number().int().positive('Total questions must be greater than 0'),
  durationMinutes: z.number().int().positive('Duration must be greater than 0'),
  totalMarks: z.number().positive('Total marks must be greater than 0'),
  passingMarks: z.number().nonnegative(),
  negativeMarkingEnabled: z.boolean().default(false),
  defaultNegativeMarks: z.number().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(1),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  timeZone: z.string().default('UTC'),
  resultVisibility: z.enum([
    'hidden',
    'marks_only',
    'full_with_answers',
    'after_manual_grading'
  ]),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  selectedTopics: z.array(z.string()).min(1, 'At least one topic must be selected'),
  difficultyConfig: z.object({
    mode: z.enum(['exact', 'percentage']),
    easy: z.number().nonnegative(),
    medium: z.number().nonnegative(),
    hard: z.number().nonnegative()
  }),
  questionTypeConfig: z.object({
    mcq: z.number().nonnegative().default(0),
    msq: z.number().nonnegative().default(0),
    true_false: z.number().nonnegative().default(0),
    short_answer: z.number().nonnegative().default(0),
    predict_output: z.number().nonnegative().default(0),
    write_code: z.number().nonnegative().default(0),
    code_output: z.number().nonnegative().default(0)
  }),
  initialAssignments: z
    .object({
      emails: z.array(z.string()).optional(),
      studentIds: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional()
    })
    .optional()
});

export const ManualGradingSchema = z.object({
  questionId: z.string(),
  marksEarned: z.number().nonnegative(),
  feedback: z.string().optional()
});
