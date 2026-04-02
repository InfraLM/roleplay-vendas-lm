import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function isInitialized(_req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'system_initialized' } });
    res.json({ initialized: config?.value === 'true' });
  } catch (err) { next(err); }
}

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.systemConfig.upsert({
      where: { key: 'system_initialized' },
      update: { value: 'true' },
      create: { key: 'system_initialized', value: 'true' },
    });
    await prisma.systemConfig.upsert({
      where: { key: 'setup_completed_at' },
      update: { value: new Date().toISOString() },
      create: { key: 'setup_completed_at', value: new Date().toISOString() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    res.json(settings || { registrationEnabled: true });
  } catch (err) { next(err); }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      const created = await prisma.systemSettings.create({ data: req.body });
      return res.json(created);
    }
    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) { next(err); }
}
