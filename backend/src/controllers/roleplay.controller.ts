import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const orgId = req.user!.organizationId;
    const { segmentId, profileId, guidedMode } = req.body;

    if (!segmentId || !profileId) {
      throw new AppError(400, 'segmentId e profileId são obrigatórios');
    }

    const roleplay = await prisma.roleplay.create({
      data: {
        userId,
        organizationId: orgId,
        segmentId,
        profileId,
        guidedMode: guidedMode || false,
      },
      include: { segment: true, clientProfile: true },
    });

    res.status(201).json(roleplay);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const roleplay = await prisma.roleplay.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { segment: true, clientProfile: true, report: true },
    });

    if (!roleplay) throw new AppError(404, 'Roleplay não encontrado');
    res.json(roleplay);
  } catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const roleplay = await prisma.roleplay.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!roleplay) throw new AppError(404, 'Roleplay não encontrado');

    const messages = await prisma.message.findMany({
      where: { roleplayId: req.params.id },
      orderBy: { turnNumber: 'asc' },
    });
    res.json(messages);
  } catch (err) { next(err); }
}

export async function pause(req: Request, res: Response, next: NextFunction) {
  try {
    const roleplay = await prisma.roleplay.updateMany({
      where: { id: req.params.id, userId: req.user!.userId, status: 'active' },
      data: { status: 'paused' },
    });
    if (roleplay.count === 0) throw new AppError(400, 'Roleplay não pode ser pausado');
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function resume(req: Request, res: Response, next: NextFunction) {
  try {
    const roleplay = await prisma.roleplay.updateMany({
      where: { id: req.params.id, userId: req.user!.userId, status: 'paused' },
      data: { status: 'active' },
    });
    if (roleplay.count === 0) throw new AppError(400, 'Roleplay não pode ser retomado');
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function listUserRoleplays(req: Request, res: Response, next: NextFunction) {
  try {
    const roleplays = await prisma.roleplay.findMany({
      where: { userId: req.user!.userId },
      include: { segment: true, clientProfile: true, report: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(roleplays);
  } catch (err) { next(err); }
}
