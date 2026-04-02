import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await prisma.clientProfile.findMany({ orderBy: { name: 'asc' } });
    res.json(profiles);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, display_name, displayName, objection_style, objectionStyle, tone_params, toneParams, whatsapp_style, whatsappStyle } = req.body;
    const profile = await prisma.clientProfile.create({
      data: {
        name,
        displayName: displayName || display_name,
        objectionStyle: objectionStyle || objection_style,
        toneParams: toneParams || tone_params || {},
        whatsappStyle: whatsappStyle ?? whatsapp_style ?? true,
      },
    });
    res.status(201).json(profile);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, display_name, displayName, objection_style, objectionStyle, tone_params, toneParams, whatsapp_style, whatsappStyle } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (displayName !== undefined || display_name !== undefined) data.displayName = displayName || display_name;
    if (objectionStyle !== undefined || objection_style !== undefined) data.objectionStyle = objectionStyle || objection_style;
    if (toneParams !== undefined || tone_params !== undefined) data.toneParams = toneParams || tone_params;
    if (whatsappStyle !== undefined || whatsapp_style !== undefined) data.whatsappStyle = whatsappStyle ?? whatsapp_style;
    const profile = await prisma.clientProfile.update({
      where: { id: req.params.id },
      data,
    });
    res.json(profile);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.clientProfile.delete({ where: { id: req.params.id } });
    res.json({ message: 'Perfil de cliente removido' });
  } catch (err) { next(err); }
}
