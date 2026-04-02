import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Ninja Ranks (12 levels)
  const ninjaRanks = [
    { level: 1, name: 'Aspirante', emoji: '🔰', color: '#9CA3AF', requiredRoleplays: 0, requiredAvgScore: 0, requiredStreak: 0, requiredVouchers: 0, xpToNextLevel: 100, description: 'Você deu o primeiro passo na jornada ninja. Continue treinando!' },
    { level: 2, name: 'Aprendiz', emoji: '📜', color: '#6B7280', requiredRoleplays: 3, requiredAvgScore: 50, requiredStreak: 0, requiredVouchers: 0, xpToNextLevel: 250, description: 'Começou a dominar as técnicas básicas de vendas.' },
    { level: 3, name: 'Genin', emoji: '⚔️', color: '#22C55E', requiredRoleplays: 10, requiredAvgScore: 55, requiredStreak: 3, requiredVouchers: 0, xpToNextLevel: 500, description: 'Ninja iniciante com habilidades promissoras.' },
    { level: 4, name: 'Genin Avançado', emoji: '🗡️', color: '#16A34A', requiredRoleplays: 20, requiredAvgScore: 60, requiredStreak: 5, requiredVouchers: 1, xpToNextLevel: 750, description: 'Suas técnicas estão ficando mais afiadas.' },
    { level: 5, name: 'Chunin', emoji: '🛡️', color: '#3B82F6', requiredRoleplays: 35, requiredAvgScore: 65, requiredStreak: 7, requiredVouchers: 2, xpToNextLevel: 1000, description: 'Líder de equipe com experiência comprovada.' },
    { level: 6, name: 'Chunin Elite', emoji: '⚡', color: '#2563EB', requiredRoleplays: 50, requiredAvgScore: 70, requiredStreak: 10, requiredVouchers: 3, xpToNextLevel: 1500, description: 'Elite entre os Chunins, pronto para maiores desafios.' },
    { level: 7, name: 'Jounin', emoji: '🔥', color: '#F97316', requiredRoleplays: 75, requiredAvgScore: 75, requiredStreak: 14, requiredVouchers: 5, xpToNextLevel: 2000, description: 'Mestre em técnicas avançadas de vendas.' },
    { level: 8, name: 'Jounin Especial', emoji: '💎', color: '#EA580C', requiredRoleplays: 100, requiredAvgScore: 78, requiredStreak: 18, requiredVouchers: 7, xpToNextLevel: 2500, description: 'Especialista reconhecido pela organização.' },
    { level: 9, name: 'ANBU', emoji: '🦅', color: '#8B5CF6', requiredRoleplays: 150, requiredAvgScore: 80, requiredStreak: 21, requiredVouchers: 10, xpToNextLevel: 3500, description: 'Força especial de elite. Missões impossíveis.' },
    { level: 10, name: 'Capitão ANBU', emoji: '👑', color: '#7C3AED', requiredRoleplays: 200, requiredAvgScore: 82, requiredStreak: 25, requiredVouchers: 15, xpToNextLevel: 5000, description: 'Líder das forças especiais. Referência para todos.' },
    { level: 11, name: 'Mestre Ninja', emoji: '🏆', color: '#EAB308', requiredRoleplays: 300, requiredAvgScore: 85, requiredStreak: 30, requiredVouchers: 20, xpToNextLevel: 7500, description: 'Alcançou a maestria suprema em vendas.' },
    { level: 12, name: 'Lenda Ninja', emoji: '⭐', color: '#FBBF24', requiredRoleplays: 500, requiredAvgScore: 90, requiredStreak: 45, requiredVouchers: 30, xpToNextLevel: null, description: 'Lenda viva. Sua fama transcende gerações.' },
  ];

  for (const rank of ninjaRanks) {
    await prisma.ninjaRank.upsert({
      where: { level: rank.level },
      update: rank,
      create: rank,
    });
  }
  console.log('✓ Ninja ranks seeded');

  // 2. Segments
  const segments = [
    { name: 'E-commerce', description: 'Lojas virtuais e marketplaces', promptContext: 'Você gerencia uma loja online com faturamento entre R$100k-500k/mês. Busca aumentar conversão e reduzir CAC.' },
    { name: 'SaaS B2B', description: 'Empresas de software como serviço', promptContext: 'Você é gestor de uma startup SaaS com 50-200 clientes. Precisa de ferramentas para escalar vendas.' },
    { name: 'Agência Digital', description: 'Agências de marketing e publicidade', promptContext: 'Você dirige uma agência com 10-30 funcionários. Busca automatizar processos e melhorar entrega.' },
    { name: 'Consultoria', description: 'Empresas de consultoria empresarial', promptContext: 'Você lidera uma consultoria especializada. Quer expandir para novos mercados com eficiência.' },
    { name: 'Educação Online', description: 'Infoprodutores e plataformas EAD', promptContext: 'Você tem cursos online com 1000+ alunos. Busca melhorar retenção e aumentar LTV.' },
  ];

  for (const segment of segments) {
    const existing = await prisma.segment.findFirst({ where: { name: segment.name } });
    if (!existing) {
      await prisma.segment.create({ data: segment });
    }
  }
  console.log('✓ Segments seeded');

  // 3. Client Profiles
  const clientProfiles = [
    { name: 'soft' as const, displayName: 'Cliente Receptivo', objectionStyle: 'Faz poucas objeções, é aberto a novas soluções', toneParams: { warmth: 0.8, patience: 0.9, skepticism: 0.2 }, whatsappStyle: true },
    { name: 'hard' as const, displayName: 'Cliente Desafiador', objectionStyle: 'Questiona bastante, precisa de provas concretas', toneParams: { warmth: 0.4, patience: 0.5, skepticism: 0.7 }, whatsappStyle: true },
    { name: 'chato' as const, displayName: 'Cliente Detalhista', objectionStyle: 'Quer saber todos os detalhes, é meticuloso', toneParams: { warmth: 0.5, patience: 0.3, skepticism: 0.6 }, whatsappStyle: true },
    { name: 'ultra_hard' as const, displayName: 'Cliente Muito Difícil', objectionStyle: 'Altamente cético, difícil de convencer', toneParams: { warmth: 0.2, patience: 0.2, skepticism: 0.9 }, whatsappStyle: true },
  ];

  for (const profile of clientProfiles) {
    const existing = await prisma.clientProfile.findFirst({ where: { name: profile.name } });
    if (!existing) {
      await prisma.clientProfile.create({ data: profile });
    }
  }
  console.log('✓ Client profiles seeded');

  // 4. System Settings
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: { registrationEnabled: true },
    });
  }
  console.log('✓ System settings seeded');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
