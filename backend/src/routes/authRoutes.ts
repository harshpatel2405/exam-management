import { Router } from 'express';
import { registerUser, loginUser, getStudentsList } from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validateRequest } from '../middleware/validate';
import { RegisterSchema, LoginSchema } from '../validators/schemas';

const router = Router();

router.post('/register', validateRequest(RegisterSchema), async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/login', validateRequest(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: { user, token }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  return res.json({ success: true, data: { user: req.user } });
});

export default router;
