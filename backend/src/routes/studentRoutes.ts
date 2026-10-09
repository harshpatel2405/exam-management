import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { getStudentsList, registerUser } from '../services/authService';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const search = req.query.search as string;
    const group = req.query.group as string;
    const students = await getStudentsList(search, group);
    return res.json({ success: true, data: students });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, studentId, groups } = req.body;
    const { user } = await registerUser({
      name,
      email,
      password: password || 'Student@123',
      role: 'student',
      studentId,
      groups
    });
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
