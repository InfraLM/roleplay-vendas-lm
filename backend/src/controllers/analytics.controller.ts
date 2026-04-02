import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { callAi, AiError } from '../services/ai.service';

export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const orgId = req.user!.organizationId;
    const { type, dateFrom, dateTo, targetUserId, includeAiInsights } = req.body;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    let reportData: any = {};

    if (type === 'individual') {
      const targetId = targetUserId || userId;
      const roleplays = await prisma.roleplay.findMany({
        where: { userId: targetId, status: 'evaluated', createdAt: { gte: from, lte: to } },
        include: { report: true, segment: true },
        orderBy: { createdAt: 'asc' },
      });

      const reports = roleplays.filter((r) => r.report).map((r) => r.report!);
      const avgScore = reports.length > 0
        ? reports.reduce((s, r) => s + r.scoreOverall, 0) / reports.length
        : 0;

      reportData = {
        totalRoleplays: roleplays.length,
        averageScore: Math.round(avgScore * 100) / 100,
        evolution: reports.map((r) => ({
          date: r.createdAt,
          score: r.scoreOverall,
          scores: r.scores,
        })),
        segmentBreakdown: {} as any,
      };

      // Segment breakdown
      for (const rp of roleplays) {
        const segName = rp.segment?.name || 'Sem segmento';
        if (!reportData.segmentBreakdown[segName]) {
          reportData.segmentBreakdown[segName] = { count: 0, totalScore: 0 };
        }
        reportData.segmentBreakdown[segName].count++;
        if (rp.report) {
          reportData.segmentBreakdown[segName].totalScore += rp.report.scoreOverall;
        }
      }
    } else if (type === 'team') {
      if (!orgId) return res.json({ error: 'Sem organização' });

      const members = await prisma.profile.findMany({
        where: { organizationId: orgId },
        select: { userId: true, name: true },
      });

      const rankings = [];
      for (const member of members) {
        const reports = await prisma.report.findMany({
          where: {
            roleplay: { userId: member.userId, createdAt: { gte: from, lte: to } },
          },
        });

        const avgScore = reports.length > 0
          ? reports.reduce((s, r) => s + r.scoreOverall, 0) / reports.length
          : 0;

        rankings.push({
          userId: member.userId,
          name: member.name,
          totalRoleplays: reports.length,
          averageScore: Math.round(avgScore * 100) / 100,
        });
      }

      rankings.sort((a, b) => b.averageScore - a.averageScore);
      reportData = { rankings, totalMembers: members.length };
    }

    // AI Insights
    if (includeAiInsights && reportData.evolution?.length > 0) {
      try {
        const insightPrompt = `Analise os seguintes dados de performance de vendas e dê 3 insights concisos em português:
${JSON.stringify(reportData)}

Responda em formato JSON: { "insights": ["insight1", "insight2", "insight3"] }`;

        const aiData = await callAi({
          messages: [{ role: 'user', content: insightPrompt }],
        });
        const content = aiData.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reportData.aiInsights = JSON.parse(jsonMatch[0]).insights;
        }
      } catch {
        // Don't fail if insights fail
      }
    }

    res.json(reportData);
  } catch (err) {
    if (err instanceof AiError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

export async function generatePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportData, title } = req.body;
    // Generate simple HTML for PDF
    const html = `<!DOCTYPE html><html><head><title>${title || 'Relatório'}</title></head><body>
      <h1>${title || 'Relatório de Performance'}</h1>
      <pre>${JSON.stringify(reportData, null, 2)}</pre>
    </body></html>`;

    res.json({ html });
  } catch (err) { next(err); }
}

export async function listSaved(req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await prisma.exportedReport.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) { next(err); }
}

export async function saveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await prisma.exportedReport.create({
      data: {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        ...req.body,
      },
    });
    res.status(201).json(report);
  } catch (err) { next(err); }
}
