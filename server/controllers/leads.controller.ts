import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, cargo, telefone, site_empresa, siteEmpresa, faturamento, tamanho_time, tamanhoTime } = req.body;
    const lead = await prisma.leadPlataforma.create({
      data: {
        nome,
        email,
        cargo: cargo || '',
        telefone: telefone || null,
        siteEmpresa: siteEmpresa || site_empresa || null,
        faturamento: faturamento || 'nenhum',
        tamanhoTime: tamanhoTime || tamanho_time || 'nenhum',
      },
    });
    res.status(201).json(lead);
  } catch (err) { next(err); }
}
