import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    let streak = await prisma.userStreak.findUnique({ where: { userId } });

    if (!streak) {
      streak = await prisma.userStreak.create({
        data: { userId, currentStreak: 0, longestStreak: 0 },
      });
    }

    // Calculate streak based on roleplay history
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;

    if (lastActivity) {
      const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        // Streak broken
        streak = await prisma.userStreak.update({
          where: { userId },
          data: { currentStreak: 0 },
        });
      }
    }

    res.json(streak);
  } catch (err) { next(err); }
}

export async function updateStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    let streak = await prisma.userStreak.findUnique({ where: { userId } });

    if (!streak) {
      streak = await prisma.userStreak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
      });
      return res.json(streak);
    }

    if (streak.lastActivityDate === today) {
      return res.json(streak); // Already counted today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    if (streak.lastActivityDate === yesterdayStr) {
      newStreak = streak.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(streak.longestStreak, newStreak);

    streak = await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        streakUpdatedAt: new Date(),
      },
    });

    res.json(streak);
  } catch (err) { next(err); }
}
