import { useState } from "react";
import { Target, Shield, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UserRole } from "@/hooks/useTeamManagement";

interface CreateUserFormProps {
  onSubmit: (data: CreateUserData) => Promise<void>;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  phone?: string;
  team?: string;
  notes?: string;
}

interface RoleCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
}

const RoleCard = ({ selected, onClick, title, description, icon: Icon }: RoleCardProps) => (
  <div
    onClick={onClick}
    className={cn(
      "p-4 rounded-lg border cursor-pointer transition-all",
      selected 
        ? "border-primary bg-primary/10" 
        : "border-border hover:border-muted-foreground"
    )}
  >
    <div className="flex items-start gap-3">
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
        selected ? "border-primary" : "border-muted-foreground"
      )}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);

export default function CreateUserForm({ onSubmit }: CreateUserFormProps) {
  const [role, setRole] = useState<UserRole>("vendedor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!email.trim()) newErrors.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido";
    if (!password) newErrors.password = "Senha é obrigatória";
    else if (password.length < 6) newErrors.password = "Mínimo de 6 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim() || undefined,
        team: team.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form on success
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setTeam("");
      setNotes("");
      setRole("vendedor");
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = role === "admin" ? "Administrador" : role === "sdr" ? "SDR" : role === "closer" ? "Closer" : "Vendedor";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Criar Novo Usuário</h3>
          <p className="text-sm text-muted-foreground">
            Crie um novo membro para sua organização e defina suas credenciais de acesso.
          </p>
        </div>
      </div>

      {/* Tipo de Acesso - Radio Cards */}
      <div className="space-y-2">
        <Label>Tipo de Acesso *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RoleCard
            selected={role === "sdr"}
            onClick={() => setRole("sdr")}
            title="SDR"
            description="Prospecção, qualificação de leads e agendamento de reuniões."
            icon={Target}
          />
          <RoleCard
            selected={role === "closer"}
            onClick={() => setRole("closer")}
            title="Closer"
            description="Fechamento de vendas, negociação e conversão de oportunidades."
            icon={Target}
          />
          <RoleCard
            selected={role === "admin"}
            onClick={() => setRole("admin")}
            title="Administrador"
            description="Acesso completo: gerenciar equipe, configurações e visualizar todos os dados."
            icon={Shield}
          />
        </div>
      </div>

      {/* Nome e Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input 
            id="name"
            placeholder="Ex: João Silva" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input 
            id="email"
            type="email"
            placeholder="email@empresa.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <Label htmlFor="password">Senha *</Label>
        <Input 
          id="password"
          type="password"
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Mínimo de 6 caracteres. O usuário poderá fazer login imediatamente.
        </p>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      {/* Telefone e Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input 
            id="phone"
            placeholder="(11) 99999-9999" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team">Equipe</Label>
          <Input 
            id="team"
            placeholder="Ex: Vendas A" 
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea 
          id="notes"
          placeholder="Informações adicionais sobre o usuário..." 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" />
            Criar {roleLabel}
          </>
        )}
      </Button>
    </form>
  );
}
