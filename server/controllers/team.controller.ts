import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from '../services/auth.service';

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) throw new AppError(400, 'Organização não encontrada');

    const profiles = await prisma.profile.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });

    const userIds = profiles.map((p) => p.userId);
    const roles = await prisma.userRoleRecord.findMany({
      where: { userId: { in: userIds } },
    });

    const roleMap = new Map(roles.map((r) => [r.userId, r.role]));

    const members = profiles.map((p) => ({
      ...p,
      role: roleMap.get(p.userId) || 'vendedor',
    }));

    res.json(members);
  } catch (err) { next(err); }
}

export async function inviteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) throw new AppError(400, 'Organização não encontrada');

    const { email, name, role, team, password, phone, notes } = req.body;

    if (!email || !name || !role) {
      throw new AppError(400, 'email, name e role são obrigatórios');
    }

    if (!['admin', 'coach', 'vendedor', 'closer', 'sdr'].includes(role)) {
      throw new AppError(400, 'Role inválido');
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'Este email já está cadastrado');
    }

    const userPassword = password || 'Mudar@123';
    const passwordHash = await hashPassword(userPassword);

    // Transaction: if any step fails, everything rolls back
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          emailConfirmed: true,
          rawUserMetaData: { name, phone: phone || null },
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          name,
          email,
          team: team || null,
          phone: phone || null,
          notes: notes || null,
          status: password ? 'active' : 'pending',
        },
      });

      await tx.userRoleRecord.create({
        data: { userId: user.id, role },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: `${name} foi adicionado à equipe.`,
      userId: newUser.id,
    });
  } catch (err) { next(err); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'coach', 'vendedor', 'closer', 'sdr'].includes(role)) {
      throw new AppError(400, 'Role inválido');
    }

    await prisma.userRoleRecord.update({
      where: { userId },
      data: { role },
    });

    res.json({ success: true, message: 'Role atualizado' });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    // Remove profile from organization (don't delete user)
    await prisma.profile.update({
      where: { userId },
      data: { organizationId: null, status: 'inactive' },
    });

    res.json({ success: true, message: 'Membro removido da organização' });
  } catch (err) { next(err); }
}

export async function listMemberGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    if (!orgId) throw new AppError(400, 'Organização não encontrada');

    const goals = await prisma.userGoal.findMany({
      where: { organizationId: orgId, isActive: true },
    });

    res.json(goals);
  } catch (err) { next(err); }
}
