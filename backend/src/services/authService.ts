import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/auth';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  studentId?: string;
  groups?: string[];
}) => {
  const normalizedEmail = data.email.trim().toLowerCase();

  const existing = await User.findOne({ normalizedEmail });
  if (existing) {
    throw new Error('An account with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = new User({
    name: data.name.trim(),
    email: data.email.trim(),
    normalizedEmail,
    passwordHash,
    role: data.role || 'student',
    isVerified: true, // Auto-verify for simplicity or set via token
    studentId: data.studentId?.trim(),
    groups: data.groups || [],
    status: 'active'
  });

  await user.save();

  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return { user, token };
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ normalizedEmail });

  if (!user) {
    throw new Error('Invalid email address or password');
  }

  if (user.status !== 'active') {
    throw new Error('Your user account has been deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email address or password');
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return { user, token };
};

export const getStudentsList = async (search?: string, group?: string) => {
  const query: any = { role: 'student' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } }
    ];
  }

  if (group) {
    query.groups = group;
  }

  return User.find(query).select('-passwordHash').sort({ name: 1 });
};
