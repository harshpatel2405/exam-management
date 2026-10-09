import mongoose from 'mongoose';
import { Exam, IExam, ExamStatus, ResultVisibilityPolicy } from '../models/Exam';
import { Question, IQuestion } from '../models/QuestionBank';
import { ExamAssignment } from '../models/ExamAssignment';

export interface IWizardInput {
  title: string;
  subject: string;
  description?: string;
  instructions?: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled?: boolean;
  defaultNegativeMarks?: number;
  maxAttempts?: number;
  startDate: string | Date;
  endDate: string | Date;
  timeZone?: string;
  resultVisibility: ResultVisibilityPolicy;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  selectedTopics: string[];
  difficultyConfig: {
    mode: 'exact' | 'percentage';
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypeConfig: {
    mcq: number;
    msq: number;
    true_false: number;
    short_answer: number;
    predict_output: number;
    write_code: number;
    code_output: number;
  };
}

export const calculateDifficultyCounts = (
  totalQuestions: number,
  config: { mode: 'exact' | 'percentage'; easy: number; medium: number; hard: number }
) => {
  if (config.mode === 'exact') {
    const sum = config.easy + config.medium + config.hard;
    if (sum !== totalQuestions) {
      throw new Error(`Total difficulty counts (${sum}) must match total questions requested (${totalQuestions})`);
    }
    return { easy: config.easy, medium: config.medium, hard: config.hard };
  } else {
    const totalPct = config.easy + config.medium + config.hard;
    if (totalPct !== 100) {
      throw new Error(`Difficulty percentages (${totalPct}%) must sum to exactly 100%`);
    }

    let easy = Math.round((totalQuestions * config.easy) / 100);
    let medium = Math.round((totalQuestions * config.medium) / 100);
    let hard = Math.round((totalQuestions * config.hard) / 100);

    const calcSum = easy + medium + hard;
    const diff = totalQuestions - calcSum;

    // Adjust largest percentage if rounding leaves a discrepancy
    if (diff !== 0) {
      if (config.medium >= config.easy && config.medium >= config.hard) {
        medium += diff;
      } else if (config.easy >= config.hard) {
        easy += diff;
      } else {
        hard += diff;
      }
    }

    return { easy, medium, hard };
  };
};

export const selectQuestionsForExam = async (
  subject: string,
  selectedTopics: string[],
  totalQuestions: number,
  difficultyConfig: { mode: 'exact' | 'percentage'; easy: number; medium: number; hard: number },
  questionTypeConfig: { [key: string]: number }
): Promise<IQuestion[]> => {
  const diffCounts = calculateDifficultyCounts(totalQuestions, difficultyConfig);

  // Check sum of question types
  const typeSum = Object.values(questionTypeConfig).reduce((acc, val) => acc + (val || 0), 0);
  if (typeSum !== totalQuestions) {
    throw new Error(`Sum of question types (${typeSum}) must equal total questions requested (${totalQuestions})`);
  }

  // Fetch all candidate questions matching subject and topics
  const candidateQuestions = await Question.find({
    subject,
    topic: { $in: selectedTopics }
  });

  if (candidateQuestions.length < totalQuestions) {
    throw new Error(
      `Insufficient questions in question bank for subject "${subject}" and topics [${selectedTopics.join(
        ', '
      )}]. Found ${candidateQuestions.length}, needed ${totalQuestions}.`
    );
  }

  const selectedQuestions: IQuestion[] = [];
  const selectedIds = new Set<string>();

  // Group candidate questions by type and difficulty
  const questionPool = new Map<string, IQuestion[]>();
  for (const q of candidateQuestions) {
    const key = `${q.questionType}:${q.difficulty}`;
    if (!questionPool.has(key)) {
      questionPool.set(key, []);
    }
    questionPool.get(key)!.push(q);
  }

  // Helper to pick randomly from a pool key
  const pickFromPool = (type: string, diff: string): IQuestion | null => {
    const key = `${type}:${diff}`;
    const pool = questionPool.get(key) || [];
    const available = pool.filter((q) => !selectedIds.has(q.questionId));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  };

  // Try to satisfy both type and difficulty criteria
  // We construct matrix of targets
  const typesNeeded: { [key: string]: number } = { ...questionTypeConfig };
  const diffsNeeded: { [key: string]: number } = { ...diffCounts };

  const activeTypes = Object.keys(typesNeeded).filter((t) => typesNeeded[t] > 0);
  const activeDiffs = ['easy', 'medium', 'hard'].filter((d) => diffsNeeded[d] > 0);

  // Iteratively select matching questions
  for (const type of activeTypes) {
    let countNeeded = typesNeeded[type];
    for (const diff of activeDiffs) {
      if (countNeeded <= 0) break;
      while (countNeeded > 0 && diffsNeeded[diff] > 0) {
        const q = pickFromPool(type, diff);
        if (!q) break;
        selectedQuestions.push(q);
        selectedIds.add(q.questionId);
        countNeeded--;
        diffsNeeded[diff]--;
      }
    }
  }

  // If strict combination matrix leaves remaining slots, fill from eligible candidate questions
  if (selectedQuestions.length < totalQuestions) {
    for (const q of candidateQuestions) {
      if (selectedQuestions.length === totalQuestions) break;
      if (!selectedIds.has(q.questionId)) {
        selectedQuestions.push(q);
        selectedIds.add(q.questionId);
      }
    }
  }

  if (selectedQuestions.length < totalQuestions) {
    throw new Error(
      `Could not fulfill exact exam criteria with available question bank. Selected ${selectedQuestions.length} of ${totalQuestions} questions.`
    );
  }

  return selectedQuestions;
};

export const createExamFromWizard = async (wizardInput: IWizardInput, adminUserId: string) => {
  const selectedQuestions = await selectQuestionsForExam(
    wizardInput.subject,
    wizardInput.selectedTopics,
    wizardInput.totalQuestions,
    wizardInput.difficultyConfig,
    wizardInput.questionTypeConfig
  );

  // Convert questions to snapshot plain objects
  const questionsSnapshot = selectedQuestions.map((q) => q.toObject());

  const exam = new Exam({
    ...wizardInput,
    questionsSnapshot,
    status: 'draft',
    isPublished: false,
    createdBy: new mongoose.Types.ObjectId(adminUserId)
  });

  await exam.save();
  return exam;
};

export const getAdminExamPreview = (exam: IExam) => {
  return {
    examId: exam._id,
    title: exam.title,
    subject: exam.subject,
    totalQuestions: exam.totalQuestions,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    startDate: exam.startDate,
    endDate: exam.endDate,
    questions: exam.questionsSnapshot // includes correct answers and explanations for admin!
  };
};

export const getStudentExamPreview = (exam: IExam) => {
  const sanitizeQuestion = (q: any) => {
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
    questions: exam.questionsSnapshot.map(sanitizeQuestion)
  };
};

export const replaceExamQuestion = async (
  examId: string,
  oldQuestionId: string,
  newQuestionId: string
) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  const newQ = await Question.findOne({ questionId: newQuestionId });
  if (!newQ) throw new Error('Replacement question not found in question bank');

  const idx = exam.questionsSnapshot.findIndex((q: any) => q.questionId === oldQuestionId);
  if (idx === -1) throw new Error('Original question not found in this exam');

  exam.questionsSnapshot[idx] = newQ.toObject();
  exam.markModified('questionsSnapshot');
  await exam.save();
  return exam;
};

export const validateExamForPublication = async (examId: string) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  if (!exam.questionsSnapshot || exam.questionsSnapshot.length === 0) {
    throw new Error('Exam has no questions');
  }

  if (exam.questionsSnapshot.length !== exam.totalQuestions) {
    throw new Error(
      `Snapshot question count (${exam.questionsSnapshot.length}) does not match totalQuestions setting (${exam.totalQuestions})`
    );
  }

  if (new Date(exam.endDate) <= new Date(exam.startDate)) {
    throw new Error('End date must be after start date');
  }

  const assignmentCount = await ExamAssignment.countDocuments({
    examId: exam._id,
    status: 'assigned'
  });

  return { isValid: true, assignmentCount, exam };
};

export const publishExam = async (examId: string) => {
  const validation = await validateExamForPublication(examId);
  if (!validation.isValid) {
    throw new Error('Exam validation failed');
  }

  const exam = validation.exam;
  exam.isPublished = true;
  exam.status = 'active';
  await exam.save();
  return exam;
};
