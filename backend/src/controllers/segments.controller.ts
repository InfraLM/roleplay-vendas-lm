import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const segments = await prisma.segment.findMany({ orderBy: { name: 'asc' } });
    res.json(segments);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const segment = await prisma.segment.create({ data: req.body });
    res.status(201).json(segment);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const segment = await prisma.segment.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(segment);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.segment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Segmento removido' });
  } catch (err) { next(err); }
}
