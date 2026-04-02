import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Segment, SegmentFormData } from "@/hooks/useSegmentManager";

interface SegmentFormProps {
  segment?: Segment;
  onSubmit: (data: SegmentFormData) => Promise<void>;
  onCancel: () => void;
}

const SegmentForm = ({ segment, onSubmit, onCancel }: SegmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [promptContext, setPromptContext] = useState(segment?.prompt_context || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "Nome deve ter no mínimo 3 caracteres";
    }

    if (!promptContext.trim() || promptContext.trim().length < 50) {
      newErrors.prompt_context = "Contexto do prompt deve ter no mínimo 50 caracteres";
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
        name: name.trim(),
        description: description.trim() || undefined,
        prompt_context: promptContext.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Segmento *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: E-commerce B2C"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição breve do segmento..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_context">Contexto do Prompt *</Label>
        <Textarea
          id="prompt_context"
          value={promptContext}
          onChange={(e) => setPromptContext(e.target.value)}
          placeholder="Descreva o contexto do segmento para a IA simular o cliente..."
          rows={6}
          className={errors.prompt_context ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          {promptContext.length}/50 caracteres mínimos
        </p>
        {errors.prompt_context && (
          <p className="text-sm text-destructive">{errors.prompt_context}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {segment ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
};

export default SegmentForm;
