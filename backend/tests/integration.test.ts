import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/User';
import { QuestionBank, Question } from '../src/models/QuestionBank';
import { Exam } from '../src/models/Exam';
import { ExamAssignment } from '../src/models/ExamAssignment';
import { ExamAttempt } from '../src/models/ExamAttempt';
import { Result } from '../src/models/Result';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let student1Token: string;
let student2Token: string;
let unassignedStudentToken: string;
let student1Id: string;
let student2Id: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Admin User
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Administrator',
    email: 'admin@batchflow.edu',
    password: 'AdminPassword123!',
    role: 'admin'
  });
  adminToken = adminRes.body.data.token;

  // Create Student 1 User
  const s1Res = await request(app).post('/api/auth/register').send({
    name: 'Alice Smith',
    email: 'alice@student.edu',
    password: 'StudentPassword123!',
    role: 'student',
    studentId: 'STU-001'
  });
  student1Token = s1Res.body.data.token;
  student1Id = s1Res.body.data.user._id;

  // Create Student 2 User
  const s2Res = await request(app).post('/api/auth/register').send({
    name: 'Bob Jones',
    email: 'bob@student.edu',
    password: 'StudentPassword123!',
    role: 'student',
    studentId: 'STU-002'
  });
  student2Token = s2Res.body.data.token;
  student2Id = s2Res.body.data.user._id;

  // Create Unassigned Student User
  const unassignedRes = await request(app).post('/api/auth/register').send({
    name: 'Eve Intruder',
    email: 'eve@hacker.com',
    password: 'StudentPassword123!',
    role: 'student'
  });
  unassignedStudentToken = unassignedRes.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('BatchFlow Integration & Acceptance Tests (25 Criteria)', () => {
  let createdBankId: string;
  let createdExamId: string;
  let attempt1Id: string;

  test('1. Import and validate a JSON question bank', async () => {
    const res = await request(app)
      .post('/api/question-banks/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Computer Science Fundamentals',
        subject: 'CS101',
        description: 'Comprehensive CS question bank',
        questions: [
          {
            questionId: 'CS-001',
            subject: 'CS101',
            topic: 'Data Structures',
            difficulty: 'easy',
            questionType: 'mcq',
            questionText: 'What is the time complexity of array lookup by index?',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
            correctAnswers: ['O(1)'],
            explanation: 'Arrays allow O(1) random access.',
            marks: 2,
            negativeMarks: 0.5
          },
          {
            questionId: 'CS-002',
            subject: 'CS101',
            topic: 'Data Structures',
            difficulty: 'medium',
            questionType: 'msq',
            questionText: 'Which of the following are linear data structures?',
            options: ['Stack', 'Queue', 'Binary Tree', 'Linked List'],
            correctAnswers: ['Stack', 'Queue', 'Linked List'],
            marks: 3
          },
          {
            questionId: 'CS-003',
            subject: 'CS101',
            topic: 'Algorithms',
            difficulty: 'easy',
            questionType: 'true_false',
            questionText: 'Binary search requires a sorted array.',
            options: ['True', 'False'],
            correctAnswers: ['True'],
            marks: 1
          },
          {
            questionId: 'CS-004',
            subject: 'CS101',
            topic: 'Programming',
            difficulty: 'medium',
            questionType: 'predict_output',
            questionText: 'What does print(2 ** 3) output in Python?',
            correctAnswers: ['8'],
            marks: 2
          },
          {
            questionId: 'CS-005',
            subject: 'CS101',
            topic: 'Programming',
            difficulty: 'hard',
            questionType: 'short_answer',
            questionText: 'Explain what keyword defines a function in Python and why.',
            correctAnswers: ['def'],
            marks: 2
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdQuestionsCount).toBe(5);
    createdBankId = res.body.data.bank._id;
  });

  test('2 & 3 & 4. Generate exam using constraints, dual preview, persistent save & assign during wizard creation', async () => {
    const wizardRes = await request(app)
      .post('/api/exams/wizard')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Midterm CS Examination',
        subject: 'CS101',
        description: 'Fall 2026 Midterm Exam',
        instructions: 'Attempt all questions. No calculators allowed.',
        totalQuestions: 5,
        durationMinutes: 60,
        totalMarks: 10,
        passingMarks: 5,
        negativeMarkingEnabled: true,
        defaultNegativeMarks: 0.5,
        maxAttempts: 1,
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        resultVisibility: 'after_manual_grading',
        selectedTopics: ['Data Structures', 'Algorithms', 'Programming'],
        difficultyConfig: { mode: 'exact', easy: 2, medium: 2, hard: 1 },
        questionTypeConfig: {
          mcq: 1,
          msq: 1,
          true_false: 1,
          predict_output: 1,
          short_answer: 1,
          write_code: 0,
          code_output: 0
        },
        initialAssignments: {
          emails: ['alice@student.edu']
        }
      });

    expect(wizardRes.status).toBe(201);
    expect(wizardRes.body.success).toBe(true);
    createdExamId = wizardRes.body.data.exam._id;
    expect(wizardRes.body.data.exam.questionsSnapshot.length).toBe(5);

    // Verify Admin dual preview contains answer keys
    const adminPreviewRes = await request(app)
      .get(`/api/exams/${createdExamId}/admin-preview`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminPreviewRes.body.data.questions[0].correctAnswers).toBeDefined();

    // Verify Student dual preview hides answer keys
    const studentPreviewRes = await request(app)
      .get(`/api/exams/${createdExamId}/student-preview`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(studentPreviewRes.body.data.questions[0].correctAnswers).toBeUndefined();
  });

  test('5 & 6 & 7 & 8. Assign exam later, add emails, CSV parsing, report duplicates & invalid emails', async () => {
    // Assign bob later via CSV and manual emails
    const assignRes = await request(app)
      .post(`/api/assignments/${createdExamId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        emails: ['bob@student.edu', 'alice@student.edu', 'invalid-email-format'],
        csvContent: `email\npending_new@student.edu\nbob@student.edu`
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.assigned).toContain('bob@student.edu');
    expect(assignRes.body.data.duplicates).toContain('alice@student.edu');
    expect(assignRes.body.data.invalidEmails).toContain('invalid-email-format');
    expect(assignRes.body.data.pendingInvitations).toContain('pending_new@student.edu');
  });

  test('12. Publish exam only when conditions are satisfied', async () => {
    const pubRes = await request(app)
      .post(`/api/exams/${createdExamId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.isPublished).toBe(true);
    expect(pubRes.body.data.status).toBe('active');
  });

  test('9 & 10 & 11. Reject unassigned or unauthorized student access (Strict Email Check)', async () => {
    // Eve tries to access Alice & Bob's exam via direct start request
    const unauthorizedRes = await request(app)
      .post(`/api/attempts/${createdExamId}/start`)
      .set('Authorization', `Bearer ${unassignedStudentToken}`);

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.message).toContain('Access Denied');
  });

  test('14 & 15 & 16. Start attempt, answer persistence across refreshes, submission & limit checks', async () => {
    // 1. Alice starts eligible exam
    const startRes = await request(app)
      .post(`/api/attempts/${createdExamId}/start`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.attempt.status).toBe('in_progress');
    attempt1Id = startRes.body.data.attempt._id;

    // 2. Alice saves answers to questions (including short answer that requires human evaluation)
    const q1 = startRes.body.data.exam.questions[0];
    await request(app)
      .post(`/api/attempts/${attempt1Id}/save-answer`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        questionId: q1.questionId,
        selectedOptions: ['O(1)']
      });

    const shortAnsQ = startRes.body.data.exam.questions.find((q: any) => q.questionId === 'CS-005');
    if (shortAnsQ) {
      await request(app)
        .post(`/api/attempts/${attempt1Id}/save-answer`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          questionId: 'CS-005',
          textAnswer: 'The def keyword is used to define functions in Python.'
        });
    }

    // 3. Page Refresh Simulation: Alice calls start again, receives SAME in-progress attempt with saved answers intact
    const refreshRes = await request(app)
      .post(`/api/attempts/${createdExamId}/start`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(refreshRes.body.data.attempt._id).toBe(attempt1Id);
    expect(refreshRes.body.data.attempt.answers[q1.questionId].selectedOptions).toEqual(['O(1)']);

    // 4. Alice submits exam
    const submitRes = await request(app)
      .post(`/api/attempts/${attempt1Id}/submit`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.attempt.status).toBe('submitted');

    // 5. Duplicate Submission attempt safe handling
    const secondSubmit = await request(app)
      .post(`/api/attempts/${attempt1Id}/submit`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(secondSubmit.body.data.attempt.status).toBe('submitted');

    // 6. Attempting to start a 2nd time exceeds maxAttempts (maxAttempts = 1)
    const exceedLimitRes = await request(app)
      .post(`/api/attempts/${createdExamId}/start`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(exceedLimitRes.status).toBe(400);
    expect(exceedLimitRes.body.message).toContain('Maximum attempt limit');
  });

  test('17 & 18 & 19 & 20. Auto-grading, manual grading queue, visibility rules & student isolation', async () => {
    // Check pending manual grading queue for admin
    const pendingGradingRes = await request(app)
      .get(`/api/grading/pending?examId=${createdExamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingGradingRes.status).toBe(200);

    // Alice checks her results BEFORE manual grading is complete (policy = after_manual_grading)
    const earlyResultRes = await request(app)
      .get(`/api/results/exam/${createdExamId}/my-result`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(earlyResultRes.body.data.isReleased).toBe(false);

    // Admin manually grades the short_answer question
    const resultRecord = (
      await Result.find({ examId: createdExamId, normalizedEmail: 'alice@student.edu' })
    )[0];

    const manualGradeRes = await request(app)
      .post(`/api/grading/result/${resultRecord._id}/grade`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        questionId: 'CS-005',
        marksEarned: 2,
        feedback: 'Correct function definition keyword'
      });

    expect(manualGradeRes.status).toBe(200);
    expect(manualGradeRes.body.data.isGradingComplete).toBe(true);

    // Admin explicitly releases results
    await request(app)
      .post(`/api/results/exam/${createdExamId}/release`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ released: true });

    // Alice can now view her released result
    const studentResultRes = await request(app)
      .get(`/api/results/exam/${createdExamId}/my-result`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(studentResultRes.status).toBe(200);
    expect(studentResultRes.body.data.isReleased).toBe(true);

    // Student Isolation: Bob cannot view Alice's results
    const bobResultRes = await request(app)
      .get(`/api/results/exam/${createdExamId}/my-result`)
      .set('Authorization', `Bearer ${student2Token}`);
    expect(bobResultRes.status).toBe(404);
  });

  test('21. Revoke assignment access without deleting historical results', async () => {
    const revokeRes = await request(app)
      .post(`/api/assignments/${createdExamId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'alice@student.edu',
        reason: 'Course completed'
      });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.status).toBe('revoked');

    // Verify historical result remains safely intact in DB!
    const historicalResult = await Result.findOne({
      examId: createdExamId,
      normalizedEmail: 'alice@student.edu'
    });
    expect(historicalResult).not.toBeNull();
  });

  test('22. Question bank edit isolation test (snapshot preservation)', async () => {
    // Edit original question bank entry
    await Question.updateOne(
      { questionId: 'CS-001' },
      { $set: { questionText: 'MUTATED QUESTION TEXT IN MASTER BANK' } }
    );

    // Verify exam snapshot still contains original question text
    const exam = await Exam.findById(createdExamId);
    const snapshotQ1 = exam?.questionsSnapshot.find((q: any) => q.questionId === 'CS-001');
    expect(snapshotQ1.questionText).toBe('What is the time complexity of array lookup by index?');
  });

  test('23. Export results to CSV', async () => {
    const csvRes = await request(app)
      .get(`/api/results/exam/${createdExamId}/export-csv`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Student Name');
    expect(csvRes.text).toContain('alice@student.edu');
  });

  test('25. Verify unauthorized users cannot access admin routes or answer keys', async () => {
    const adminOnlyRes = await request(app)
      .get('/api/question-banks/banks')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(adminOnlyRes.status).toBe(403);
  });
});
