import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptEditorProps {
  template: string;
  defaultTemplate: string;
  variables: string[];
  onSave: (template: string) => Promise<void>;
  isSaving?: boolean;
}

const PromptEditor = ({ 
  template, 
  defaultTemplate, 
  variables, 
  onSave,
  isSaving = false
}: PromptEditorProps) => {
  const [value, setValue] = useState(template);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setValue(template);
    setHasChanges(false);
  }, [template]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setHasChanges(newValue !== template);
  };

  const handleSave = async () => {
    await onSave(value);
    setHasChanges(false);
  };

  const handleReset = () => {
    setValue(defaultTemplate);
    setHasChanges(defaultTemplate !== template);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('prompt-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + variable + value.slice(end);
    
    setValue(newValue);
    setHasChanges(newValue !== template);

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Template do Prompt</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4 mr-1" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restaurar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Clique nas variáveis para inserir no prompt:
        </Label>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <Badge
              key={variable}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => insertVariable(variable)}
            >
              {variable}
            </Badge>
          ))}
        </div>
      </div>

      <Textarea
        id="prompt-editor"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Digite o template do prompt..."
        rows={20}
        className="font-mono text-sm"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.length} caracteres</span>
        {hasChanges && (
          <span className="text-yellow-500">Alterações não salvas</span>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;
