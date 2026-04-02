import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LiberdadeMedicaLogo from "@/components/LiberdadeMedicaLogo";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstName = profile?.name?.split(" ")[0] || "Usuário";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!orgName.trim()) {
      setError("Nome da empresa é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/organizations', { name: orgName.trim() });

      toast({
        title: "Empresa criada! 🎉",
        description: `${orgName.trim()} foi configurada com sucesso. Você é o administrador.`,
      });

      // Force page reload to refresh auth context with new org data
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <LiberdadeMedicaLogo className="w-32" />
          </div>

          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Para começar, configure sua empresa no <strong>Liberdade Medica</strong>.
            <br />
            Você será o <strong>administrador</strong> e poderá convidar sua equipe depois.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Ex: Minha Empresa LTDA"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando empresa...
                </>
              ) : (
                <>
                  Criar Empresa e Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Sair da conta
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
