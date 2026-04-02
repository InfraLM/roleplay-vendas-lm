import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions);
}

export async function signup(email: string, password: string, name: string, phone?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(400, 'Este email já está cadastrado');
  }

  // Check if registration is enabled
  const settings = await prisma.systemSettings.findFirst();
  if (settings && !settings.registrationEnabled) {
    throw new AppError(403, 'Registro de novos usuários está desabilitado');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailConfirmed: true,
      rawUserMetaData: { name, phone: phone || null },
    },
  });

  // Auto-assign to existing organization
  const existingOrg = await prisma.organization.findFirst();
  const organizationId = existingOrg?.id || null;

  // Create profile linked to existing org
  await prisma.profile.create({
    data: {
      userId: user.id,
      name,
      email,
      phone: phone || null,
      status: 'active',
      organizationId,
    },
  });

  // Assign default role (never admin on signup)
  await prisma.userRoleRecord.create({
    data: {
      userId: user.id,
      role: 'vendedor',
    },
  });

  const role = 'vendedor';

  const tokenPayload: JwtPayload = { userId: user.id, email, role, organizationId };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken, role, organizationId };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Email ou senha incorretos');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Email ou senha incorretos');
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const userRole = await prisma.userRoleRecord.findUnique({ where: { userId: user.id } });
  const role = userRole?.role || 'vendedor';
  const organizationId = profile?.organizationId || null;

  const tokenPayload: JwtPayload = { userId: user.id, email: user.email, role, organizationId };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await saveRefreshToken(user.id, refreshToken);

  return { user, profile, accessToken, refreshToken, role, organizationId };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshTokenValue, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, 'Refresh token inválido ou expirado');
  }

  const tokenHash = hashToken(refreshTokenValue);
  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash, userId: decoded.userId },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token inválido ou expirado');
  }

  // Get fresh user data
  const profile = await prisma.profile.findUnique({ where: { userId: decoded.userId } });
  const userRole = await prisma.userRoleRecord.findUnique({ where: { userId: decoded.userId } });

  const newPayload: JwtPayload = {
    userId: decoded.userId,
    email: decoded.email,
    role: userRole?.role || 'vendedor',
    organizationId: profile?.organizationId || null,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  await saveRefreshToken(decoded.userId, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const userRole = await prisma.userRoleRecord.findUnique({ where: { userId } });

  return {
    id: user.id,
    email: user.email,
    profile,
    role: userRole?.role || 'vendedor',
    organizationId: profile?.organizationId || null,
  };
}

export async function generateResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if user exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires },
  });

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(400, 'Token inválido ou expirado');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    },
  });
}

// Helpers
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken(userId: string, token: string) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}
