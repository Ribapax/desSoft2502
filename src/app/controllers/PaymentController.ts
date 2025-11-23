import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../application/services/PaymentService';
import { createPaymentSchema, updatePaymentSchema } from '../validators/paymentSchemas';

export class PaymentController {
  private readonly service = new PaymentService();

  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reservationId = req.query.reservationId as string | undefined;
      const payments = await this.service.list(reservationId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  };

  public find = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await this.service.find(req.params.id);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createPaymentSchema.parse(req.body);
      const payment = await this.service.create(payload);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updatePaymentSchema.parse(req.body);
      const payment = await this.service.update(req.params.id, payload);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
