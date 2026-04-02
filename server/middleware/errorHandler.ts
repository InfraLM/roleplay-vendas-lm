import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Log full error details for debugging
  console.error(`[Error] ${err.name}: ${err.message}`);
  console.error(err.stack || err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Dados inválidos', details: err });
  }

  // Prisma errors - log details
  if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientValidationError') {
    console.error('[Prisma Error Details]', JSON.stringify(err, null, 2));
    return res.status(500).json({
      error: 'Erro no banco de dados',
      details: err.message,
    });
  }

  return res.status(500).json({
    error: 'Erro interno do servidor',
    details: err.message,
  });
}
