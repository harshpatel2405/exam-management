import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string;
  studentId?: string;
  groups?: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    normalizedEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    studentId: { type: String, trim: true },
    groups: [{ type: String, trim: true }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

UserSchema.index({ normalizedEmail: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
