import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const segments = await prisma.segment.findMany({ orderBy: { name: 'asc' } });
    res.json(segments);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, prompt_context, promptContext, sales_objective, salesObjective } = req.body;
    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || null,
        promptContext: promptContext || prompt_context,
        salesObjective: salesObjective || sales_objective || 'completo',
      },
    });
    res.status(201).json(segment);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, prompt_context, promptContext, sales_objective, salesObjective } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (promptContext !== undefined || prompt_context !== undefined) {
      data.promptContext = promptContext || prompt_context;
    }
    if (salesObjective !== undefined || sales_objective !== undefined) {
      data.salesObjective = salesObjective || sales_objective;
    }
    const segment = await prisma.segment.update({
      where: { id: req.params.id },
      data,
    });
    res.json(segment);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.segment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Produto removido' });
  } catch (err) { next(err); }
}
