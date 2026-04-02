import { useNavigate } from "react-router-dom";
import { Play, MessageSquare, BarChart3, Trophy, Users, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LiberdadeMedicaLogo from "@/components/LiberdadeMedicaLogo";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Roleplay Realista",
      description: "Converse com IA que simula diferentes perfis de clientes",
    },
    {
      icon: BarChart3,
      title: "Avaliação Automática",
      description: "Receba feedback detalhado sobre sua performance",
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Ganhe vouchers e prêmios quando atingir notas excelentes",
    },
    {
      icon: Users,
      title: "Ranking da Equipe",
      description: "Compare sua performance com colegas",
    },
  ];

  const benefits = [
    "Treine objeções em ambiente seguro",
    "Melhore suas técnicas de diagnóstico",
    "Pratique diferentes perfis de clientes",
    "Receba feedback acionável imediato",
    "Acompanhe sua evolução com métricas",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <LiberdadeMedicaLogo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="rounded-xl" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button className="btn-primary px-4 py-2" onClick={() => navigate("/auth")}>
              <Play className="w-4 h-4 mr-2" />
              Começar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 tech-grid">
        <div className="container mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Treine o seu time</span>
            <br />
            <span className="text-foreground">com Inteligência Artificial</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A arena de treinamento onde sua equipe de vendas desenvolve habilidades reais
            através de simulações com IA, feedback instantâneo e gamificação.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-primary px-8 py-6 text-lg"
              onClick={() => navigate("/roleplay")}
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Primeiro Roleplay
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="btn-outline px-8 py-6 text-lg"
              onClick={() => navigate("/dashboard")}
            >
              Ver Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Tudo que você precisa para <span className="gradient-text">vender mais</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="card-base bg-gradient-card border-border/30 hover:border-primary/50 transition-all duration-300 interactive-element"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in">
              <h2 className="text-3xl font-bold mb-8 text-foreground">
                Por que treinar com <span className="gradient-text">Liberdade Medica</span>?
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="card-base bg-gradient-card border-primary/30 animate-scale-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Próximo Nível</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Taxa de Conversão</span>
                      <span className="text-success font-semibold">+35%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[75%] bg-gradient-primary rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Confiança</span>
                      <span className="text-success font-semibold">+60%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-primary rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Tempo de Negociação</span>
                      <span className="text-success font-semibold">-40%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-primary rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Pronto para <span className="gradient-text">Dominar suas Vendas</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Comece agora e transforme sua equipe em vendedores de alta performance.
          </p>
          <Button 
            size="lg" 
            className="btn-primary px-10 py-6 text-lg animate-pulse-glow"
            onClick={() => navigate("/auth")}
          >
            <Zap className="w-5 h-5 mr-2" />
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <LiberdadeMedicaLogo size="sm" />
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © 2025 Liberdade Medica. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Este projeto é um template estrutural. Nenhum dado é compartilhado em remixes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
