import mongoose, { Schema, Document } from 'mongoose';

export type AssignmentStatus = 'assigned' | 'pending_invitation' | 'revoked';
export type InvitationStatus = 'not_sent' | 'pending' | 'sent' | 'failed';

export interface IExamAssignment extends Document {
  examId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  normalizedEmail: string;
  status: AssignmentStatus;
  invitationStatus: InvitationStatus;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  revokedAt?: Date;
  revocationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamAssignmentSchema: Schema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    normalizedEmail: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['assigned', 'pending_invitation', 'revoked'],
      default: 'assigned'
    },
    invitationStatus: {
      type: String,
      enum: ['not_sent', 'pending', 'sent', 'failed'],
      default: 'not_sent'
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    revocationReason: { type: String }
  },
  { timestamps: true }
);

ExamAssignmentSchema.index({ examId: 1, normalizedEmail: 1 }, { unique: true });
ExamAssignmentSchema.index({ normalizedEmail: 1, status: 1 });

export const ExamAssignment = mongoose.model<IExamAssignment>(
  'ExamAssignment',
  ExamAssignmentSchema
);
