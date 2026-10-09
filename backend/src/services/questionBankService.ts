import mongoose from 'mongoose';
import { QuestionBank, Question, IQuestion } from '../models/QuestionBank';

export interface IQuestionImportData {
  questionId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType:
    | 'mcq'
    | 'msq'
    | 'true_false'
    | 'short_answer'
    | 'predict_output'
    | 'write_code'
    | 'code_output';
  questionText: string;
  options?: string[];
  correctAnswers: string[];
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  codeSnippet?: string;
  expectedOutput?: string;
  sampleInput?: string;
  sampleOutput?: string;
  tags?: string[];
}

export const importQuestionBankJSON = async (
  title: string,
  subject: string,
  description: string | undefined,
  questionsData: IQuestionImportData[],
  userId: string
) => {
  const bank = new QuestionBank({
    title,
    subject,
    description,
    questionCount: questionsData.length,
    createdBy: new mongoose.Types.ObjectId(userId)
  });
  await bank.save();

  const createdQuestions: IQuestion[] = [];
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const qData of questionsData) {
    if (seenIds.has(qData.questionId)) {
      duplicateIds.push(qData.questionId);
      continue;
    }
    seenIds.add(qData.questionId);

    const question = new Question({
      ...qData,
      subject, // guarantee matching subject
      marks: qData.marks ?? 1,
      negativeMarks: qData.negativeMarks ?? 0,
      bankId: bank._id
    });
    await question.save();
    createdQuestions.push(question);
  }

  bank.questionCount = createdQuestions.length;
  await bank.save();

  return { bank, createdQuestionsCount: createdQuestions.length, duplicateIds };
};

export const getQuestions = async (filters: {
  subject?: string;
  topics?: string[];
  difficulty?: string;
  questionType?: string;
  search?: string;
  bankId?: string;
}) => {
  const query: any = {};

  if (filters.subject) query.subject = filters.subject;
  if (filters.topics && filters.topics.length > 0) query.topic = { $in: filters.topics };
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.questionType) query.questionType = filters.questionType;
  if (filters.bankId) query.bankId = filters.bankId;

  if (filters.search) {
    query.$or = [
      { questionText: { $regex: filters.search, $options: 'i' } },
      { questionId: { $regex: filters.search, $options: 'i' } },
      { topic: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return Question.find(query).sort({ topic: 1, difficulty: 1 });
};

export const getTopicsForSubject = async (subject: string) => {
  const topics = await Question.distinct('topic', { subject });
  return topics.sort();
};
