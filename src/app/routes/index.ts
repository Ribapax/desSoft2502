import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { SpaceController } from '../controllers/SpaceController';
import { ReservationController } from '../controllers/ReservationController';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();

const userController = new UserController();
const spaceController = new SpaceController();
const reservationController = new ReservationController();
const paymentController = new PaymentController();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/users', userController.list);
router.get('/users/:id', userController.find);
router.post('/users', userController.create);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);

router.get('/spaces', spaceController.list);
router.get('/spaces/:id', spaceController.find);
router.post('/spaces', spaceController.create);
router.put('/spaces/:id', spaceController.update);
router.delete('/spaces/:id', spaceController.delete);

router.get('/reservations', reservationController.list);
router.get('/reservations/:id', reservationController.find);
router.post('/reservations', reservationController.create);
router.put('/reservations/:id', reservationController.update);
router.delete('/reservations/:id', reservationController.delete);

router.get('/payments', paymentController.list);
router.get('/payments/:id', paymentController.find);
router.post('/payments', paymentController.create);
router.put('/payments/:id', paymentController.update);
router.delete('/payments/:id', paymentController.delete);

export default router;
