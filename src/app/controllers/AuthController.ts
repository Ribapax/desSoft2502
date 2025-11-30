import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { authLoginSchema } from '../validators/authSchemas';

export class AuthController {
  private readonly service = new AuthService();

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = authLoginSchema.parse(req.body);
      const result = await this.service.login(payload.email, payload.password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
