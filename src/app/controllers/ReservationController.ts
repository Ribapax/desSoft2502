import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../../application/services/ReservationService';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationQuerySchema
} from '../validators/reservationSchemas';

export class ReservationController {
  private readonly service = new ReservationService();

  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = reservationQuerySchema.parse(req.query);
      const reservations = await this.service.list(filters);
      res.json(reservations);
    } catch (error) {
      next(error);
    }
  };

  public find = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reservation = await this.service.find(req.params.id);
      res.json(reservation);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createReservationSchema.parse(req.body);
      const reservation = await this.service.create(payload);
      res.status(201).json(reservation);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateReservationSchema.parse(req.body);
      const reservation = await this.service.update(req.params.id, payload);
      res.json(reservation);
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
