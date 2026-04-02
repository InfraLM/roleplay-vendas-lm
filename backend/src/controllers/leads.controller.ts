import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await prisma.leadPlataforma.create({ data: req.body });
    res.status(201).json(lead);
  } catch (err) { next(err); }
}
