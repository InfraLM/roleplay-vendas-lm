import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, ShoppingCart, Building2, GraduationCap, Heart, Briefcase, User, UserCheck, UserX, Search, Clock, MessageSquare, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import LiberdadeMedicaLogo from "@/components/LiberdadeMedicaLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useSegments } from "@/hooks/useSegments";
import { useRoleplay } from "@/hooks/useRoleplay";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PausedRoleplay {
  id: string;
  segment_name: string;
  client_name: string;
  message_count: number;
  message_limit: number;
  created_at: string;
}

const getSegmentIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('e-commerce') || lowerName.includes('varejo')) return ShoppingCart;
  if (lowerName.includes('saas') || lowerName.includes('b2b')) return Building2;
  if (lowerName.includes('educa') || lowerName.includes('infoproduto')) return GraduationCap;
  if (lowerName.includes('saúde') || lowerName.includes('saude')) return Heart;
  if (lowerName.includes('imob') || lowerName.includes('financ')) return Briefcase;
  return Building2;
};

const getProfileDifficulty = (name: string): { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (name) {
    case 'receptivo':
      return { label: 'Fácil', color: 'text-success', variant: 'secondary' };
    case 'cetico':
      return { label: 'Médio', color: 'text-warning', variant: 'outline' };
    case 'desafiador':
      return { label: 'Difícil', color: 'text-destructive', variant: 'destructive' };
    case 'analitico':
      return { label: 'Técnico', color: 'text-primary', variant: 'default' };
    default:
      return { label: 'Normal', color: 'text-muted-foreground', variant: 'outline' };
  }
};

const getProfileIcon = (name: string) => {
  switch (name) {
    case 'receptivo':
      return UserCheck;
    case 'cetico':
      return Search;
    case 'desafiador':
      return UserX;
    case 'analitico':
      return User;
    default:
      return User;
  }
};

const RoleplaySelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { segments, clientProfiles, isLoading, error } = useSegments();
  const { createRoleplay, isLoading: isCreating } = useRoleplay();
  
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [guidedMode, setGuidedMode] = useState(false);
  const [pausedRoleplays, setPausedRoleplays] = useState<PausedRoleplay[]>([]);
  const [loadingPaused, setLoadingPaused] = useState(true);

  useEffect(() => {
    const fetchPausedRoleplays = async () => {
      if (!user) return;
      
      try {
        const data = await api.get<any[]>('/roleplays/mine?status=paused,active&limit=5');

        if (data) {
          setPausedRoleplays(data.map(r => ({
            id: r.id,
            segment_name: r.segmentName || r.segment?.name || 'Produto',
            client_name: r.clientProfileName || r.clientProfile?.displayName || 'Cliente',
            message_count: r.messageCount,
            message_limit: r.messageLimit,
            created_at: r.createdAt
          })));
        }
      } catch (error) {
        console.error('Error fetching paused roleplays:', error);
      } finally {
        setLoadingPaused(false);
      }
    };

    fetchPausedRoleplays();
  }, [user]);

  const handleStartRoleplay = async () => {
    if (!selectedSegment || !selectedProfile) return;
    
    try {
      const roleplay = await createRoleplay(selectedSegment, selectedProfile, guidedMode);
      navigate(`/roleplay/${roleplay.id}`);
    } catch (error) {
      console.error('Error starting roleplay:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar dados: {error}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <LiberdadeMedicaLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Paused Roleplays Section */}
        {!loadingPaused && pausedRoleplays.length > 0 && (
          <section className="animate-fade-in">
            <Card className="bg-card/50 border-yellow-500/30 border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg">Continuar Treinamento</CardTitle>
                    <CardDescription>Você tem roleplays pausados ou em andamento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pausedRoleplays.map((roleplay) => (
                  <div
                    key={roleplay.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {roleplay.segment_name} • {roleplay.client_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{format(new Date(roleplay.created_at), "dd MMM yyyy HH:mm", { locale: ptBR })}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {roleplay.message_count}/{roleplay.message_limit}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/roleplay/${roleplay.id}`)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Continuar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Step 1: Escolher Segmento */}
        <section className="animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              1. Escolha o <span className="gradient-text">Produto</span>
            </h2>
            <p className="text-muted-foreground">Selecione o mercado que você quer praticar</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment, index) => {
                const Icon = getSegmentIcon(segment.name);
                const isSelected = selectedSegment === segment.id;
                
                return (
                  <Card 
                    key={segment.id}
                    className={`cursor-pointer transition-all duration-300 hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'bg-card'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedSegment(segment.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-primary/10'}`}>
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {segment.description || segment.prompt_context}
                      </p>
                      {(segment.salesObjective || segment.sales_objective) && (segment.salesObjective || segment.sales_objective) !== 'completo' && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {(segment.salesObjective || segment.sales_objective) === 'qualificacao' ? '📞 SDR — Qualificação' : '🤝 Closer — Fechamento'}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: Escolher Perfil de Cliente */}
        <section className={`animate-fade-in ${!selectedSegment ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              2. Escolha o <span className="gradient-text">Perfil do Cliente</span>
            </h2>
            <p className="text-muted-foreground">Selecione o tipo de cliente que você quer enfrentar</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientProfiles.map((profile, index) => {
                const Icon = getProfileIcon(profile.name);
                const difficulty = getProfileDifficulty(profile.name);
                const isSelected = selectedProfile === profile.id;
                
                return (
                  <Card 
                    key={profile.id}
                    className={`cursor-pointer transition-all duration-300 hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'bg-card'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedProfile(profile.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-primary/10'}`}>
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{profile.display_name}</CardTitle>
                        </div>
                        <Badge variant={difficulty.variant} className={difficulty.color}>
                          {difficulty.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Estilo de objeção:</span> {profile.objection_style}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 3: Modo Guiado (opcional) */}
        <section className={`animate-fade-in ${!selectedProfile ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${guidedMode ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                <Lightbulb className={`w-5 h-5 ${guidedMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">Modo Treinamento Guiado</p>
                <p className="text-sm text-muted-foreground">
                  Receba dicas de coaching em tempo real durante a conversa
                </p>
              </div>
            </div>
            <Switch checked={guidedMode} onCheckedChange={setGuidedMode} />
          </div>
        </section>

        {/* Botão Iniciar */}
        <div className="flex justify-center pt-6">
          <Button 
            size="lg"
            className="btn-primary px-8 py-6 text-lg gap-3"
            disabled={!selectedSegment || !selectedProfile || isCreating}
            onClick={handleStartRoleplay}
          >
            {isCreating ? (
              <>Iniciando...</>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Iniciar Roleplay
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RoleplaySelection;
