import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Upload, Link, CheckCircle2, Loader2, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LiberdadeMedicaLogo from '@/components/LiberdadeMedicaLogo';
import { api } from '@/lib/api';
import CsvImporter from '@/components/setup/CsvImporter';
import SheetsConnector from '@/components/setup/SheetsConnector';

type SetupOption = 'empty' | 'import' | 'connect' | null;
type SetupView = 'select' | 'csv' | 'sheets';

const DEFAULT_NINJA_RANKS = [
  { level: 1, name: 'Iniciante', emoji: '🟢', color: '#22c55e', description: 'Começando a jornada de vendas', required_roleplays: 0, required_avg_score: 0, required_streak: 0, required_vouchers: 0, xp_to_next_level: 100 },
  { level: 2, name: 'Aprendiz', emoji: '🔵', color: '#3b82f6', description: 'Desenvolvendo habilidades fundamentais', required_roleplays: 5, required_avg_score: 60, required_streak: 3, required_vouchers: 2, xp_to_next_level: 250 },
  { level: 3, name: 'Praticante', emoji: '🟣', color: '#a855f7', description: 'Consistência no treino diário', required_roleplays: 15, required_avg_score: 70, required_streak: 7, required_vouchers: 5, xp_to_next_level: 500 },
  { level: 4, name: 'Especialista', emoji: '🟠', color: '#f97316', description: 'Dominando a arte da venda', required_roleplays: 30, required_avg_score: 80, required_streak: 14, required_vouchers: 10, xp_to_next_level: 1000 },
  { level: 5, name: 'Mestre', emoji: '🔴', color: '#ef4444', description: 'Excelência comprovada em vendas', required_roleplays: 50, required_avg_score: 90, required_streak: 30, required_vouchers: 20, xp_to_next_level: null },
];

export default function Setup() {
  const navigate = useNavigate();
  const { initializeSystem, isInitialized } = useSystemConfig();
  const [selectedOption, setSelectedOption] = useState<SetupOption>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<SetupView>('select');

  if (isInitialized) {
    navigate('/auth', { replace: true });
    return null;
  }

  const finalizeSetup = async () => {
    setIsProcessing(true);
    try {
      // Insert default ninja ranks (ignore if already exist)
      // Ninja ranks are seeded by the backend on database setup
      
      const success = await initializeSystem();
      if (success) {
        toast({ title: 'Sistema configurado!', description: 'Seu ambiente está pronto. Cadastre-se para começar.' });
        navigate('/auth', { replace: true });
      } else {
        // Already initialized
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast({ title: 'Erro no setup', description: 'Não foi possível configurar o sistema. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (selectedOption === 'empty') {
      finalizeSetup();
    } else if (selectedOption === 'import') {
      setView('csv');
    } else if (selectedOption === 'connect') {
      setView('sheets');
    }
  };

  const options = [
    {
      id: 'empty' as const,
      icon: Database,
      title: 'Criar Banco Vazio',
      description: 'Usar apenas a estrutura herdada. O primeiro usuário a se cadastrar será o administrador.',
      details: [
        'Banco de dados 100% limpo',
        'Gamificação com 5 níveis configurados',
        'Admin pode criar produtos e perfis manualmente',
      ],
      recommended: true,
    },
    {
      id: 'import' as const,
      icon: Upload,
      title: 'Importar CSV',
      description: 'Upload de arquivo CSV para popular produtos, perfis de clientes e prêmios.',
      details: [
        'Validação de schema antes de importar',
        'Preview dos dados antes de confirmar',
        'Suporte a produtos, perfis e prêmios',
      ],
    },
    {
      id: 'connect' as const,
      icon: Link,
      title: 'Conectar Google Sheets',
      description: 'Importar dados diretamente de uma planilha Google Sheets — pública ou privada.',
      details: [
        'Compartilhe a planilha com nosso leitor e cole o link',
        'Mapeie abas para tabelas do sistema',
        'Preview e validação antes de importar',
      ],
    },
  ];

  // Show CSV importer or Sheets connector
  if (view === 'csv') {
    return (
      <SetupShell>
        <CsvImporter onBack={() => setView('select')} onComplete={finalizeSetup} />
      </SetupShell>
    );
  }

  if (view === 'sheets') {
    return (
      <SetupShell>
        <SheetsConnector onBack={() => setView('select')} onComplete={finalizeSetup} onSwitchToCsv={() => setView('csv')} />
      </SetupShell>
    );
  }

  return (
    <SetupShell>
      {/* Info Banner */}
      <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Você tem controle total sobre quais dados serão usados neste projeto.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Este projeto foi iniciado sem dados. Configure sua fonte de dados para continuar.
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuração Inicial</h1>
        <p className="text-muted-foreground">Escolha como deseja configurar os dados do seu projeto</p>
      </div>

      {/* Options Grid */}
      <div className="grid gap-6 md:grid-cols-1">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          return (
            <Card
              key={option.id}
              className={`relative cursor-pointer transition-all hover:border-primary/50 ${isSelected ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => setSelectedOption(option.id)}
            >
              {option.recommended && (
                <div className="absolute -top-3 left-4 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                  Recomendado
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{option.description}</CardDescription>
                <ul className="space-y-2">
                  {option.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <Button size="lg" disabled={!selectedOption || isProcessing} onClick={handleContinue} className="min-w-[200px]">
          {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Configurando...</> : 'Continuar'}
        </Button>
      </div>
    </SetupShell>
  );
}

function SetupShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <LiberdadeMedicaLogo size="md" />
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">{children}</main>
      <footer className="border-t border-border/50 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Este é um template estrutural. Nenhum dado do projeto original foi copiado.</p>
        </div>
      </footer>
    </div>
  );
}
