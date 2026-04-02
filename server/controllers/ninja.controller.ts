import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function listRanks(_req: Request, res: Response, next: NextFunction) {
  try {
    const ranks = await prisma.ninjaRank.findMany({ orderBy: { level: 'asc' } });
    res.json(ranks);
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    let progress = await prisma.userNinjaProgress.findUnique({ where: { userId } });

    if (!progress) {
      progress = await prisma.userNinjaProgress.create({
        data: { userId, currentLevel: 1, currentXp: 0, totalXp: 0 },
      });
    }

    const currentRank = await prisma.ninjaRank.findUnique({ where: { level: progress.currentLevel || 1 } });
    const nextRank = await prisma.ninjaRank.findFirst({
      where: { level: (progress.currentLevel || 1) + 1 },
    });

    res.json({ progress, currentRank, nextRank });
  } catch (err) { next(err); }
}

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { score, messageCount } = req.body;

    let progress = await prisma.userNinjaProgress.findUnique({ where: { userId } });
    if (!progress) {
      progress = await prisma.userNinjaProgress.create({
        data: { userId, currentLevel: 1, currentXp: 0, totalXp: 0 },
      });
    }

    // Calculate XP: base 10 + score bonus + length bonus
    const baseXp = 10;
    const scoreBonus = Math.floor((score || 0) / 10);
    const lengthBonus = Math.min(Math.floor((messageCount || 0) / 5), 10);
    const earnedXp = baseXp + scoreBonus + lengthBonus;

    const newTotalXp = (progress.totalXp || 0) + earnedXp;
    const newCurrentXp = (progress.currentXp || 0) + earnedXp;
    const newTotalRoleplays = (progress.totalRoleplays || 0) + 1;

    // Recalculate avg score
    const prevTotal = (progress.avgScore || 0) * (progress.totalRoleplays || 0);
    const newAvgScore = (prevTotal + (score || 0)) / newTotalRoleplays;

    // Get streak for best_streak
    const streak = await prisma.userStreak.findUnique({ where: { userId } });
    const bestStreak = Math.max(progress.bestStreak || 0, streak?.currentStreak || 0);

    // Get voucher count
    const voucherCount = await prisma.voucher.count({ where: { userId } });

    // Check level up
    let currentLevel = progress.currentLevel || 1;
    let currentXp = newCurrentXp;
    let levelUpAt = progress.levelUpAt;

    const currentRank = await prisma.ninjaRank.findUnique({ where: { level: currentLevel } });
    const nextRank = await prisma.ninjaRank.findFirst({ where: { level: currentLevel + 1 } });

    if (nextRank && currentRank?.xpToNextLevel) {
      const meetsXp = currentXp >= currentRank.xpToNextLevel;
      const meetsRoleplays = newTotalRoleplays >= (nextRank.requiredRoleplays || 0);
      const meetsScore = newAvgScore >= (nextRank.requiredAvgScore || 0);
      const meetsStreak = bestStreak >= (nextRank.requiredStreak || 0);
      const meetsVouchers = voucherCount >= (nextRank.requiredVouchers || 0);

      if (meetsXp && meetsRoleplays && meetsScore && meetsStreak && meetsVouchers) {
        currentLevel += 1;
        currentXp = currentXp - currentRank.xpToNextLevel;
        levelUpAt = new Date();
      }
    }

    const updated = await prisma.userNinjaProgress.update({
      where: { userId },
      data: {
        currentLevel,
        currentXp,
        totalXp: newTotalXp,
        totalRoleplays: newTotalRoleplays,
        avgScore: Math.round(newAvgScore * 100) / 100,
        bestStreak,
        totalVouchers: voucherCount,
        levelUpAt,
      },
    });

    const leveledUp = currentLevel > (progress.currentLevel || 1);

    res.json({ progress: updated, leveledUp, earnedXp });
  } catch (err) { next(err); }
}

export async function recalculate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const roleplays = await prisma.roleplay.count({ where: { userId, status: 'evaluated' } });
    const reports = await prisma.report.findMany({
      where: { roleplay: { userId } },
      select: { scoreOverall: true },
    });
    const avgScore = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.scoreOverall, 0) / reports.length
      : 0;
    const streak = await prisma.userStreak.findUnique({ where: { userId } });
    const voucherCount = await prisma.voucher.count({ where: { userId } });

    const progress = await prisma.userNinjaProgress.upsert({
      where: { userId },
      update: {
        totalRoleplays: roleplays,
        avgScore: Math.round(avgScore * 100) / 100,
        bestStreak: Math.max(streak?.currentStreak || 0, streak?.longestStreak || 0),
        totalVouchers: voucherCount,
      },
      create: {
        userId,
        currentLevel: 1,
        currentXp: 0,
        totalXp: 0,
        totalRoleplays: roleplays,
        avgScore: Math.round(avgScore * 100) / 100,
        bestStreak: Math.max(streak?.currentStreak || 0, streak?.longestStreak || 0),
        totalVouchers: voucherCount,
      },
    });

    res.json({ progress });
  } catch (err) { next(err); }
}
