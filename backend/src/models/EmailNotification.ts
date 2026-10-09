import mongoose, { Schema, Document } from 'mongoose';

export type EmailType =
  | 'exam_invitation'
  | 'exam_reminder'
  | 'registration_instructions'
  | 'assignment_change'
  | 'completion_confirmation'
  | 'result_published';

export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface IEmailNotification extends Document {
  recipientEmail: string;
  type: EmailType;
  subject: string;
  body: string;
  examId?: mongoose.Types.ObjectId;
  status: EmailStatus;
  attemptsCount: number;
  lastError?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailNotificationSchema: Schema = new Schema(
  {
    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: [
        'exam_invitation',
        'exam_reminder',
        'registration_instructions',
        'assignment_change',
        'completion_confirmation',
        'result_published'
      ],
      required: true
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    attemptsCount: { type: Number, default: 0 },
    lastError: { type: String },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

export const EmailNotification = mongoose.model<IEmailNotification>(
  'EmailNotification',
  EmailNotificationSchema
);
