import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { callAi } from '../services/ai.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.user!.organizationId;
    const prompts = await prisma.promptTemplate.findMany({
      where: { organizationId: orgId },
      orderBy: { type: 'asc' },
    });
    res.json(prompts);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const prompt = await prisma.promptTemplate.update({
      where: { id: req.params.id },
      data: { template: req.body.template },
    });
    res.json(prompt);
  } catch (err) { next(err); }
}

export async function testPrompt(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, template, testData, executeAI } = req.body;

    // Replace variables in template
    let rendered = template;
    if (testData) {
      for (const [key, value] of Object.entries(testData)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
      }
    }

    let aiResponse = null;
    if (executeAI) {
      const result = await callAi({
        messages: [{ role: 'user', content: rendered }],
      });
      aiResponse = result.choices[0]?.message?.content || null;
    }

    res.json({ rendered, aiResponse });
  } catch (err) { next(err); }
}
