import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ClientProfile, ClientProfileFormData, ClientProfileType } from "@/hooks/useClientProfileManager";

interface ClientProfileFormProps {
  profile?: ClientProfile;
  onSubmit: (data: ClientProfileFormData) => Promise<void>;
  onCancel: () => void;
}

const profileTypes: { value: ClientProfileType; label: string; description: string }[] = [
  { value: 'soft', label: 'Receptivo (Fácil)', description: 'Cliente aberto e interessado' },
  { value: 'hard', label: 'Cético (Médio)', description: 'Cliente questionador mas educado' },
  { value: 'chato', label: 'Difícil', description: 'Cliente exigente e impaciente' },
  { value: 'ultra_hard', label: 'Expert', description: 'Cliente técnico e desafiador' },
];

const ClientProfileForm = ({ profile, onSubmit, onCancel }: ClientProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState<ClientProfileType>(profile?.name || 'soft');
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [objectionStyle, setObjectionStyle] = useState(profile?.objection_style || "");
  const [whatsappStyle, setWhatsappStyle] = useState(profile?.whatsapp_style ?? true);
  const [toneParams, setToneParams] = useState({
    patience: profile?.tone_params?.patience ?? 5,
    aggression: profile?.tone_params?.aggression ?? 3,
    knowledge: profile?.tone_params?.knowledge ?? 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim() || displayName.trim().length < 3) {
      newErrors.displayName = "Nome de exibição deve ter no mínimo 3 caracteres";
    }

    if (!objectionStyle.trim() || objectionStyle.trim().length < 20) {
      newErrors.objectionStyle = "Estilo de objeção deve ter no mínimo 20 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        display_name: displayName.trim(),
        objection_style: objectionStyle.trim(),
        whatsapp_style: whatsappStyle,
        tone_params: toneParams
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tipo de Perfil *</Label>
        <Select value={name} onValueChange={(v) => setName(v as ClientProfileType)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {profileTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Nome de Exibição *</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ex: Cliente Indeciso"
          className={errors.displayName ? "border-destructive" : ""}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="objectionStyle">Estilo de Objeção *</Label>
        <Textarea
          id="objectionStyle"
          value={objectionStyle}
          onChange={(e) => setObjectionStyle(e.target.value)}
          placeholder="Descreva como este cliente faz objeções..."
          rows={4}
          className={errors.objectionStyle ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          {objectionStyle.length}/20 caracteres mínimos
        </p>
        {errors.objectionStyle && (
          <p className="text-sm text-destructive">{errors.objectionStyle}</p>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <Label>Parâmetros de Tom</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Paciência (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={toneParams.patience}
              onChange={(e) => setToneParams({ ...toneParams, patience: parseInt(e.target.value) || 5 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Agressividade (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={toneParams.aggression}
              onChange={(e) => setToneParams({ ...toneParams, aggression: parseInt(e.target.value) || 3 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Conhecimento (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={toneParams.knowledge}
              onChange={(e) => setToneParams({ ...toneParams, knowledge: parseInt(e.target.value) || 5 })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <Label htmlFor="whatsapp">Estilo WhatsApp</Label>
          <p className="text-xs text-muted-foreground">
            Mensagens curtas e informais
          </p>
        </div>
        <Switch
          id="whatsapp"
          checked={whatsappStyle}
          onCheckedChange={setWhatsappStyle}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {profile ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};

export default ClientProfileForm;
