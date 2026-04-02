import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function listActive(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const prizes = await prisma.prize.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { vouchersRequired: 'asc' },
    });
    res.json(prizes);
  } catch (err) { next(err); }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const prizes = await prisma.prize.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(prizes);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const prize = await prisma.prize.create({
      data: { ...req.body, organizationId: req.user!.organizationId },
    });
    res.status(201).json(prize);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const prize = await prisma.prize.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(prize);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.prize.delete({ where: { id: req.params.id } });
    res.json({ message: 'Prêmio removido' });
  } catch (err) { next(err); }
}

export async function redeemPrize(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const prizeId = req.params.id;
    const { voucherIds } = req.body;

    const prize = await prisma.prize.findUnique({ where: { id: prizeId } });
    if (!prize) throw new AppError(404, 'Prêmio não encontrado');
    if (!prize.isActive) throw new AppError(400, 'Prêmio não está disponível');
    if (prize.quantityAvailable !== null && prize.quantityAvailable <= 0) {
      throw new AppError(400, 'Prêmio esgotado');
    }

    // Mark vouchers as redeemed
    await prisma.voucher.updateMany({
      where: { id: { in: voucherIds }, userId, status: 'issued' },
      data: { status: 'redeemed' },
    });

    // Create redemption record
    const redemption = await prisma.prizeRedemption.create({
      data: {
        userId,
        prizeId,
        organizationId: req.user!.organizationId,
        voucherIds,
        status: 'pending',
      },
    });

    // Decrease quantity if applicable
    if (prize.quantityAvailable !== null) {
      await prisma.prize.update({
        where: { id: prizeId },
        data: { quantityAvailable: prize.quantityAvailable - 1 },
      });
    }

    res.status(201).json(redemption);
  } catch (err) { next(err); }
}

export async function listRedemptions(req: Request, res: Response, next: NextFunction) {
  try {
    const redemptions = await prisma.prizeRedemption.findMany({
      where: { userId: req.user!.userId },
      include: { prize: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(redemptions);
  } catch (err) { next(err); }
}

export async function listAllRedemptions(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const redemptions = await prisma.prizeRedemption.findMany({
      where: { organizationId: orgId },
      include: { prize: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(redemptions);
  } catch (err) { next(err); }
}

export async function updateRedemption(req: Request, res: Response, next: NextFunction) {
  try {
    const redemption = await prisma.prizeRedemption.update({
      where: { id: req.params.id },
      data: { status: req.body.status, notes: req.body.notes },
    });
    res.json(redemption);
  } catch (err) { next(err); }
}
