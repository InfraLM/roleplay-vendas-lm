import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function getGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId || req.user!.userId;
    const goal = await prisma.userGoal.findFirst({
      where: { userId, isActive: true },
    });
    res.json(goal);
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId || req.user!.userId;

    const goal = await prisma.userGoal.findFirst({ where: { userId, isActive: true } });
    if (!goal) return res.json(null);

    // Calculate progress
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekRoleplays = await prisma.roleplay.count({
      where: { userId, status: 'evaluated', createdAt: { gte: weekStart } },
    });

    const weekReports = await prisma.report.findMany({
      where: { roleplay: { userId, createdAt: { gte: weekStart } } },
      select: { scoreOverall: true },
    });

    const avgScore = weekReports.length > 0
      ? weekReports.reduce((sum, r) => sum + r.scoreOverall, 0) / weekReports.length
      : 0;

    const monthVouchers = await prisma.voucher.count({
      where: { userId, createdAt: { gte: monthStart } },
    });

    res.json({
      goal,
      progress: {
        roleplaysThisWeek: weekRoleplays,
        avgScoreThisWeek: Math.round(avgScore * 100) / 100,
        vouchersThisMonth: monthVouchers,
      },
    });
  } catch (err) { next(err); }
}

export async function setGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, roleplaysPerWeek, minScore, vouchersPerMonth, notes } = req.body;
    const targetUserId = userId || req.user!.userId;
    const orgId = req.user!.organizationId;

    // Deactivate existing goals
    await prisma.userGoal.updateMany({
      where: { userId: targetUserId, isActive: true },
      data: { isActive: false },
    });

    const goal = await prisma.userGoal.create({
      data: {
        userId: targetUserId,
        organizationId: orgId,
        roleplaysPerWeek,
        minScore,
        vouchersPerMonth,
        setBy: req.user!.userId,
        notes,
        isActive: true,
      },
    });

    res.status(201).json(goal);
  } catch (err) { next(err); }
}

export async function clearGoal(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.userGoal.updateMany({
      where: { userId: req.params.userId, isActive: true },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}
