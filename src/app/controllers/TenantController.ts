import { NextFunction, Request, Response } from 'express';
import { TenantService } from '../../application/services/TenantService';
import { createTenantSchema, updateTenantSchema } from '../validators/tenantSchemas';

export class TenantController {
  private readonly service = new TenantService();

  public list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tenants = await this.service.list();
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  };

  public find = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.service.find(req.params.id);
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createTenantSchema.parse(req.body);
      const tenant = await this.service.create(payload);
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateTenantSchema.parse(req.body);
      const tenant = await this.service.update(req.params.id, payload);
      res.json(tenant);
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
