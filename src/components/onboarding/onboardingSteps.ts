import { 
  Rocket, 
  Users, 
  Target, 
  MessageSquare, 
  Gift, 
  BarChart3,
  Play,
  Trophy,
  Ticket,
  LayoutDashboard
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  targetElement: string | null; // CSS selector or null for modal-only
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Onboarding steps for Admin users
export const adminSteps: OnboardingStep[] = [
  {
    id: 'welcome-admin',
    title: 'Bem-vindo, {{first_name}}! 👋',
    description: 'Você chegou ao <strong>Liberdade Medica</strong>, a plataforma que vai transformar a capacitação do seu time de Vendas.<br/><br/>Vamos conhecer as <strong>principais funcionalidades</strong> para configurar sua equipe e começar a treinar os vendedores.',
    icon: Rocket,
    targetElement: null,
    position: 'center',
  },
  {
    id: 'team-management',
    title: 'Gerenciar Equipe',
    description: 'Adicione <strong>vendedores e SDRs</strong> à sua equipe.<br/><br/>Você pode definir <strong>metas individuais</strong>, acompanhar o progresso e gerenciar permissões de cada membro.',
    icon: Users,
    targetElement: '[data-onboarding="menu-equipe"]',
    position: 'right',
  },
  {
    id: 'segments-profiles',
    title: 'Segmentos e Perfis',
    description: 'Configure os <strong>mercados de atuação</strong> (SaaS, E-commerce, Agências) e os <strong>tipos de cliente</strong> (Receptivo, Desafiador, Difícil) para as simulações.',
    icon: Target,
    targetElement: '[data-onboarding="menu-cenarios"]',
    position: 'right',
  },
  {
    id: 'prompts',
    title: 'Personalizar Prompts',
    description: 'Ajuste como a <strong>IA se comporta</strong> nas simulações e nas avaliações.<br/><br/>Personalize o tom, estilo e critérios de avaliação.',
    icon: MessageSquare,
    targetElement: '[data-onboarding="menu-prompts"]',
    position: 'right',
  },
  {
    id: 'prizes',
    title: 'Catálogo de Prêmios',
    description: 'Crie <strong>prêmios incríveis</strong> que sua equipe pode resgatar usando os <strong>vouchers conquistados</strong> em treinamentos com boa pontuação.',
    icon: Gift,
    targetElement: '[data-onboarding="menu-premios"]',
    position: 'right',
  },
  {
    id: 'analytics',
    title: 'Analytics e Relatórios',
    description: 'Acompanhe o <strong>desempenho da equipe</strong> com gráficos detalhados, rankings e métricas de evolução.<br/><br/>Gere <strong>relatórios</strong> para análise.',
    icon: BarChart3,
    targetElement: '[data-onboarding="menu-analytics"]',
    position: 'right',
  },
];

// Onboarding steps for Vendedor/SDR users
export const vendedorSteps: OnboardingStep[] = [
  {
    id: 'welcome-vendedor',
    title: 'Bem-vindo, {{first_name}}! 🎯',
    description: 'Você chegou ao <strong>Liberdade Medica</strong>!<br/><br/>Aqui você vai treinar suas <strong>habilidades de vendas</strong> com simulações de IA realistas e receber <strong>feedback instantâneo</strong> para melhorar cada vez mais.',
    icon: Rocket,
    targetElement: null,
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Seu Dashboard',
    description: 'Acompanhe seu <strong>desempenho geral</strong>, streak de treinamentos consecutivos, metas definidas pelo seu gestor e seu <strong>progresso ao longo do tempo</strong>.',
    icon: LayoutDashboard,
    targetElement: '[data-onboarding="stats-cards"]',
    position: 'bottom',
  },
  {
    id: 'start-roleplay',
    title: 'Inicie um Roleplay',
    description: 'Clique em "<strong>Novo Roleplay</strong>" para escolher um segmento de mercado e perfil de cliente.<br/><br/>A IA vai simular um <strong>cliente real</strong> para você praticar.',
    icon: Play,
    targetElement: '[data-onboarding="menu-novo-roleplay"]',
    position: 'right',
  },
  {
    id: 'evaluation',
    title: 'Avaliação e Feedback',
    description: 'Após cada simulação, você receberá uma <strong>nota detalhada</strong> com feedback sobre rapport, tratamento de objeções, técnicas de fechamento e mais.',
    icon: Trophy,
    targetElement: null,
    position: 'center',
  },
  {
    id: 'vouchers',
    title: 'Ganhe Vouchers! 🎁',
    description: 'Notas acima de <strong>75 pontos</strong> ganham vouchers!<br/><br/>Acumule vouchers e troque por <strong>prêmios incríveis</strong> no catálogo da empresa.',
    icon: Ticket,
    targetElement: '[data-onboarding="menu-vouchers"]',
    position: 'right',
  },
];

export function getStepsForRole(role: string | null): OnboardingStep[] {
  if (role === 'admin') {
    return adminSteps;
  }
  return vendedorSteps;
}
