import { Router } from 'express';
import userRouter from './users';
import { authRouter } from './auth';
import clientRouter from './clients';
import shopRouter from './shops';
import accountRouter from './accounts';

const router = Router();

// API version info
router.get('/', (req, res) => {
  res.json({
    message: 'Admin UI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      shops: '/api/shops',
      accounts: '/api/accounts',
      health: '/health'
    }
  });
});

// Route modules
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/clients', clientRouter);
router.use('/shops', shopRouter);
router.use('/accounts', accountRouter);

export { router as apiRouter };
