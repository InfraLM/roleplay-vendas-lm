import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { next(err); }
}

export async function redeem(req: Request, res: Response, next: NextFunction) {
  try {
    const { voucherIds } = req.body;
    await prisma.voucher.updateMany({
      where: { id: { in: voucherIds }, userId: req.user!.userId },
      data: { status: 'redeemed' },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}
