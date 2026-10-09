export type UserRole = 'admin' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  normalizedEmail: string;
  role: UserRole;
  isVerified: boolean;
  studentId?: string;
  groups?: string[];
  status: 'active' | 'inactive';
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType =
  | 'mcq'
  | 'msq'
  | 'true_false'
  | 'short_answer'
  | 'predict_output'
  | 'write_code'
  | 'code_output';

export interface Question {
  _id?: string;
  questionId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswers?: string[];
  explanation?: string;
  marks: number;
  negativeMarks: number;
  codeSnippet?: string;
  expectedOutput?: string;
  sampleInput?: string;
  sampleOutput?: string;
  tags?: string[];
}

export interface QuestionBank {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  questionCount: number;
  createdAt: string;
}

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

export interface Exam {
  _id: string;
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
  startDate: string;
  endDate: string;
  timeZone: string;
  resultVisibility: ResultVisibilityPolicy;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  status: ExamStatus;
  isPublished: boolean;
  selectedTopics: string[];
  questionsSnapshot?: Question[];
  availabilityStatus?: 'upcoming' | 'available' | 'closed';
}

export interface ExamAssignment {
  _id: string;
  examId: string;
  studentId?: { _id: string; name: string; email: string; studentId?: string };
  normalizedEmail: string;
  status: 'assigned' | 'pending_invitation' | 'revoked';
  invitationStatus: 'not_sent' | 'pending' | 'sent' | 'failed';
  assignedAt: string;
  attemptStatus?: string;
  attemptCount?: number;
  submittedAt?: string;
  revocationReason?: string;
}

export interface ExamAttempt {
  _id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  startTime: string;
  expiresAt: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'timed_out';
  answers: Record<string, {
    questionId: string;
    selectedOptions?: string[];
    textAnswer?: string;
    codeAnswer?: string;
    outputAnswer?: string;
    isMarkedForReview?: boolean;
  }>;
}

export interface QuestionResult {
  questionId: string;
  questionType: QuestionType;
  maxMarks: number;
  marksEarned: number;
  status: 'correct' | 'incorrect' | 'unanswered' | 'pending_manual';
  feedback?: string;
  studentResponse?: any;
  correctAnswerKey?: any;
  explanation?: string;
}

export interface ResultRecord {
  _id: string;
  examId: string;
  studentId: { _id: string; name: string; email: string; studentId?: string };
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
  releasedToStudent: boolean;
  questionResults: QuestionResult[];
  evaluatedAt: string;
}
