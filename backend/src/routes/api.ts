import { Router } from 'express';
import userRouter from './users';
import { authRouter } from './auth';
import clientRouter from './clients';
import shopRouter from './shops';
import accountRouter from './accounts';
import shopClientRouter from './shopClients';
import documentRouter from './documents';

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
      shopClients: '/api/shop-clients',
      documents: '/api/documents',
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
router.use('/shop-clients', shopClientRouter);
router.use('/documents', documentRouter);

export { router as apiRouter };
