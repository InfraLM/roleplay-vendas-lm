import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, ArrowLeft, ArrowRight, CheckCircle2, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import ImportStepIndicator from './ImportStepIndicator';
import CsvPreviewTable from './CsvPreviewTable';
import { parseCsv, validateRows, prepareInsertData, TABLE_SCHEMAS, type ImportTable, type TableSchema } from '@/lib/csvParser';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const STEPS = [
  { label: 'Tabela' },
  { label: 'Upload' },
  { label: 'Preview' },
  { label: 'Confirmar' },
];

interface CsvImporterProps {
  onBack: () => void;
  onComplete: () => Promise<void>;
}

export default function CsvImporter({ onBack, onComplete }: CsvImporterProps) {
  const [step, setStep] = useState(0);
  const [selectedTable, setSelectedTable] = useState<ImportTable | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isInserting, setIsInserting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const schema = TABLE_SCHEMAS.find(s => s.table === selectedTable);

  const handleFileRead = useCallback((file: File) => {
    if (!schema) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);

      if (result.errors.length > 0) {
        setValidationErrors(result.errors);
        return;
      }

      // Check required columns exist
      const missingCols = schema.requiredColumns.filter(c => !result.headers.includes(c));
      if (missingCols.length > 0) {
        setValidationErrors([`Colunas obrigatórias ausentes: ${missingCols.join(', ')}. Encontradas: ${result.headers.join(', ')}`]);
        return;
      }

      const rowErrors = validateRows(result.rows, schema);
      setValidationErrors(rowErrors);
      setHeaders(result.headers.filter(h => [...schema.requiredColumns, ...schema.optionalColumns].includes(h)));
      setRows(result.rows);
      if (rowErrors.length === 0) setStep(2);
    };
    reader.readAsText(file, 'UTF-8');
  }, [schema]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileRead(file);
    } else {
      setValidationErrors(['Por favor, selecione um arquivo .csv']);
    }
  }, [handleFileRead]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const handleInsert = async () => {
    if (!schema) return;
    setIsInserting(true);
    try {
      const data = prepareInsertData(rows, schema);
      // Map table names to API endpoints
      const tableToEndpoint: Record<string, string> = {
        segments: '/segments',
        client_profiles: '/client-profiles',
      };
      const endpoint = tableToEndpoint[schema.table] || `/${schema.table}`;
      for (const item of data) {
        await api.post(endpoint, item);
      }

      toast({ title: 'Dados importados!', description: `${rows.length} registros inseridos em ${schema.label}.` });
      setStep(3);
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-xl font-semibold">Importar CSV</h2>
      </div>

      <ImportStepIndicator steps={STEPS} currentStep={step} />

      {/* Step 0: Select table */}
      {step === 0 && (
        <div className="grid gap-4">
          {TABLE_SCHEMAS.map(s => (
            <Card
              key={s.table}
              className={`cursor-pointer transition-all hover:border-primary/50 ${selectedTable === s.table ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => setSelectedTable(s.table)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{s.description}</CardDescription>
                <p className="text-xs text-muted-foreground mt-2">
                  Colunas obrigatórias: <span className="font-mono">{s.requiredColumns.join(', ')}</span>
                  {s.optionalColumns.length > 0 && (
                    <> · Opcionais: <span className="font-mono">{s.optionalColumns.join(', ')}</span></>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
          <Button disabled={!selectedTable} onClick={() => setStep(1)}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && schema && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Arraste um arquivo CSV aqui ou clique para selecionar
                </p>
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
                  <Button variant="outline" size="sm" asChild>
                    <span><FileText className="h-4 w-4 mr-1" /> Selecionar arquivo</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                O CSV deve conter as colunas: <span className="font-mono">{schema.requiredColumns.join(', ')}</span>
              </p>
            </CardContent>
          </Card>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="text-sm space-y-1 mt-1">
                  {validationErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {validationErrors.length > 5 && <li>...e mais {validationErrors.length - 5} erros</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button variant="ghost" onClick={() => { setStep(0); setValidationErrors([]); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Trocar tabela
          </Button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && schema && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rows.length} registros prontos para importar em <strong>{schema.label}</strong>
            </p>
          </div>
          <CsvPreviewTable headers={headers} rows={rows} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep(1); setRows([]); setHeaders([]); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Reenviar
            </Button>
            <Button onClick={handleInsert} disabled={isInserting}>
              {isInserting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando...</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar importação</>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && schema && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">{rows.length} registros importados!</h3>
          <p className="text-sm text-muted-foreground">
            Dados inseridos em {schema.label}. Você pode importar outra tabela ou finalizar o setup.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setStep(0); setSelectedTable(null); setRows([]); setHeaders([]); }}>
              Importar outra tabela
            </Button>
            <Button onClick={onComplete}>
              Finalizar Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
