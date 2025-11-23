import { Request, Response, NextFunction } from 'express';
import { SpaceService } from '../../application/services/SpaceService';
import { createSpaceSchema, updateSpaceSchema } from '../validators/spaceSchemas';

export class SpaceController {
  private readonly service = new SpaceService();

  public list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const spaces = await this.service.list();
      res.json(spaces);
    } catch (error) {
      next(error);
    }
  };

  public find = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const space = await this.service.find(req.params.id);
      res.json(space);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createSpaceSchema.parse(req.body);
      const space = await this.service.create(payload);
      res.status(201).json(space);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateSpaceSchema.parse(req.body);
      const space = await this.service.update(req.params.id, payload);
      res.json(space);
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
