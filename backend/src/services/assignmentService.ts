import mongoose from 'mongoose';
import { ExamAssignment } from '../models/ExamAssignment';
import { User } from '../models/User';
import { Exam } from '../models/Exam';
import { ExamAttempt } from '../models/ExamAttempt';
import { AuditLog } from '../models/AuditLog';
import { queueAndSendEmail } from './emailService';
import { parse as parseCsv } from 'csv-parse/sync';

export interface IAssignmentInput {
  emails?: string[];
  studentIds?: string[];
  groups?: string[];
  csvContent?: string;
  sendNotifications?: boolean;
}

export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const parseEmailsFromInput = async (input: IAssignmentInput) => {
  const emailSet = new Set<string>();
  const invalidEmails: string[] = [];

  // 1. Raw emails array
  if (input.emails && Array.isArray(input.emails)) {
    for (const em of input.emails) {
      const norm = em.trim().toLowerCase();
      if (isValidEmail(norm)) {
        emailSet.add(norm);
      } else if (norm.length > 0) {
        invalidEmails.push(norm);
      }
    }
  }

  // 2. Student IDs array
  if (input.studentIds && Array.isArray(input.studentIds)) {
    const students = await User.find({ _id: { $in: input.studentIds } });
    for (const s of students) {
      emailSet.add(s.normalizedEmail);
    }
  }

  // 3. Groups array
  if (input.groups && Array.isArray(input.groups)) {
    const groupStudents = await User.find({ groups: { $in: input.groups }, role: 'student' });
    for (const s of groupStudents) {
      emailSet.add(s.normalizedEmail);
    }
  }

  // 4. CSV Content string
  if (input.csvContent && input.csvContent.trim().length > 0) {
    try {
      const records = parseCsv(input.csvContent, {
        columns: false,
        skip_empty_lines: true,
        trim: true
      });
      for (const row of records) {
        // Look for email in any column of the row
        for (const cell of row) {
          const norm = cell.trim().toLowerCase();
          if (isValidEmail(norm)) {
            emailSet.add(norm);
          }
        }
      }
    } catch (err: any) {
      console.error('Error parsing CSV:', err.message);
    }
  }

  return { emails: Array.from(emailSet), invalidEmails };
};

export const assignStudentsToExam = async (
  examId: string,
  assignmentInput: IAssignmentInput,
  adminUserId: string
) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error('Exam not found');

  const { emails, invalidEmails } = await parseEmailsFromInput(assignmentInput);

  const registeredUsers = await User.find({ normalizedEmail: { $in: emails } });
  const registeredUserMap = new Map<string, any>();
  for (const u of registeredUsers) {
    registeredUserMap.set(u.normalizedEmail, u);
  }

  const assignedCount: string[] = [];
  const duplicateCount: string[] = [];
  const pendingInvitations: string[] = [];

  for (const email of emails) {
    const existing = await ExamAssignment.findOne({ examId, normalizedEmail: email });
    if (existing) {
      if (existing.status === 'revoked') {
        // Re-activate assignment
        existing.status = 'assigned';
        existing.revokedAt = undefined;
        existing.revocationReason = undefined;
        await existing.save();
        assignedCount.push(email);
      } else {
        duplicateCount.push(email);
      }
      continue;
    }

    const regUser = registeredUserMap.get(email);
    const assignment = new ExamAssignment({
      examId: exam._id,
      studentId: regUser ? regUser._id : undefined,
      normalizedEmail: email,
      status: 'assigned',
      invitationStatus: 'not_sent',
      assignedBy: new mongoose.Types.ObjectId(adminUserId)
    });

    await assignment.save();
    assignedCount.push(email);

    if (!regUser) {
      pendingInvitations.push(email);
    }

    // Send invitation email if enabled
    if (assignmentInput.sendNotifications) {
      const subject = `Exam Invitation: ${exam.title}`;
      const body = `
        <h2>You have been assigned an examination</h2>
        <p><strong>Exam:</strong> ${exam.title}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>Duration:</strong> ${exam.durationMinutes} minutes</p>
        <p><strong>Available From:</strong> ${new Date(exam.startDate).toLocaleString()}</p>
        <p><strong>Available Until:</strong> ${new Date(exam.endDate).toLocaleString()}</p>
        <p>Please log in to your BatchFlow account with your email <strong>${email}</strong> to start the exam when it opens.</p>
      `;
      await queueAndSendEmail(email, 'exam_invitation', subject, body, exam._id.toString());
      assignment.invitationStatus = 'sent';
      await assignment.save();
    }
  }

  // Update exam status if it was awaiting assignment
  if (exam.status === 'awaiting_assignment' && assignedCount.length > 0) {
    exam.status = 'ready_to_publish';
    await exam.save();
  }

  // Write audit log
  const adminUser = await User.findById(adminUserId);
  const audit = new AuditLog({
    action: 'ASSIGN_EXAM_STUDENTS',
    performedBy: new mongoose.Types.ObjectId(adminUserId),
    userEmail: adminUser?.email || 'admin@batchflow.local',
    targetRef: `Exam:${examId}`,
    details: {
      assignedCount: assignedCount.length,
      duplicateCount: duplicateCount.length,
      invalidCount: invalidEmails.length,
      pendingInvitationsCount: pendingInvitations.length
    }
  });
  await audit.save();

  return {
    assigned: assignedCount,
    duplicates: duplicateCount,
    invalidEmails,
    pendingInvitations
  };
};

export const revokeStudentAssignment = async (
  examId: string,
  normalizedEmail: string,
  adminUserId: string,
  reason?: string
) => {
  const norm = normalizedEmail.trim().toLowerCase();
  const assignment = await ExamAssignment.findOne({ examId, normalizedEmail: norm });

  if (!assignment) {
    throw new Error('Assignment record not found for this email and exam');
  }

  assignment.status = 'revoked';
  assignment.revokedAt = new Date();
  assignment.revocationReason = reason || 'Revoked by administrator';
  await assignment.save();

  // Audit log
  const adminUser = await User.findById(adminUserId);
  const audit = new AuditLog({
    action: 'REVOKE_EXAM_ASSIGNMENT',
    performedBy: new mongoose.Types.ObjectId(adminUserId),
    userEmail: adminUser?.email || 'admin@batchflow.local',
    targetRef: `Exam:${examId}`,
    details: { email: norm, reason }
  });
  await audit.save();

  return assignment;
};

export const getExamAssignments = async (examId: string) => {
  const assignments = await ExamAssignment.find({ examId })
    .populate('studentId', 'name email studentId status')
    .sort({ createdAt: -1 });

  // Enrich with attempt status if student has started
  const enriched = await Promise.all(
    assignments.map(async (assign) => {
      const obj = assign.toObject();
      const attempt = await ExamAttempt.findOne({
        examId,
        normalizedEmail: assign.normalizedEmail
      }).sort({ attemptNumber: -1 });

      return {
        ...obj,
        attemptStatus: attempt ? attempt.status : 'not_started',
        attemptCount: attempt ? attempt.attemptNumber : 0,
        submittedAt: attempt ? attempt.submittedAt : null
      };
    })
  );

  return enriched;
};
