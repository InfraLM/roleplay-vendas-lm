import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, phone } = req.body;
    const result = await authService.signup(email, password, name, phone);

    res.status(201).json({
      user: { id: result.user.id, email: result.user.email },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.role,
      organizationId: result.organizationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      user: { id: result.user.id, email: result.user.email },
      profile: result.profile,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.role,
      organizationId: result.organizationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.userId);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const token = await authService.generateResetToken(email);
    // In production, send email with reset link
    // For now, return token directly (development only)
    res.json({
      message: 'Se o email existir, um link de recuperação será enviado.',
      ...(process.env.NODE_ENV === 'development' && token ? { resetToken: token } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.getMe(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
