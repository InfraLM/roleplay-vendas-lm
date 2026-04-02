import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, team, specialties, notes } = req.body;
    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { name, phone, team, specialties, notes },
    });
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { onboardingCompleted: true },
    });
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateVisitedPages(req: Request, res: Response, next: NextFunction) {
  try {
    const { visitedPages } = req.body;
    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: { visitedPages },
    });
    res.json(profile);
  } catch (err) { next(err); }
}
