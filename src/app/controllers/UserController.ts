import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../application/services/UserService';
import { createUserSchema, updateUserSchema } from '../validators/userSchemas';

export class UserController {
  private readonly service = new UserService();

  public list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.service.list();
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  public find = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.find(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createUserSchema.parse(req.body);
      const user = await this.service.create(payload);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateUserSchema.parse(req.body);
      const user = await this.service.update(req.params.id, payload);
      res.json(user);
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
