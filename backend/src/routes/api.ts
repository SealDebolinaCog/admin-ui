import { Router } from 'express';
import userRouter from './users';
import { authRouter } from './auth';

const router = Router();

// API version info
router.get('/', (req, res) => {
  res.json({
    message: 'Admin UI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      health: '/health'
    }
  });
});

// Route modules
router.use('/auth', authRouter);
router.use('/users', userRouter);

export { router as apiRouter };
