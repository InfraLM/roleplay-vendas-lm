import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await prisma.clientProfile.findMany({ orderBy: { name: 'asc' } });
    res.json(profiles);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.clientProfile.create({ data: req.body });
    res.status(201).json(profile);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.clientProfile.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(profile);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.clientProfile.delete({ where: { id: req.params.id } });
    res.json({ message: 'Perfil de cliente removido' });
  } catch (err) { next(err); }
}
