import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Globe, FileSpreadsheet, Info, Upload, Copy } from 'lucide-react';
import ImportStepIndicator from './ImportStepIndicator';
import CsvPreviewTable from './CsvPreviewTable';
import { validateRows, prepareInsertData, TABLE_SCHEMAS, type ImportTable } from '@/lib/csvParser';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const STEPS = [
  { label: 'URL' },
  { label: 'Mapear' },
  { label: 'Preview' },
  { label: 'Confirmar' },
];

const SERVICE_ACCOUNT_EMAIL = 'sheets-reader@hidden-server-487815-n6.iam.gserviceaccount.com';

interface SheetsConnectorProps {
  onBack: () => void;
  onComplete: () => Promise<void>;
  onSwitchToCsv?: () => void;
}

interface SheetTab {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

export default function SheetsConnector({ onBack, onComplete, onSwitchToCsv }: SheetsConnectorProps) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sheetData, setSheetData] = useState<SheetTab | null>(null);
  const [selectedTable, setSelectedTable] = useState<ImportTable | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isInserting, setIsInserting] = useState(false);
  const [copied, setCopied] = useState(false);

  const schema = TABLE_SCHEMAS.find(s => s.table === selectedTable);

  const copyEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopied(true);
    toast({ title: 'Email copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchSheet = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.post<{ sheetName?: string; headers: string[]; rows: Record<string, string>[]; error?: string }>('/sheets/fetch', {
        spreadsheetUrl: url,
        sheetName: sheetName || undefined,
      });

      if (data.error) throw new Error(data.error);

      setSheetData({
        name: data.sheetName || 'Sheet1',
        headers: data.headers,
        rows: data.rows,
      });
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar planilha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapAndValidate = () => {
    if (!schema || !sheetData) return;
    const missingCols = schema.requiredColumns.filter(c => !sheetData.headers.includes(c));
    if (missingCols.length > 0) {
      setValidationErrors([`Colunas obrigatórias ausentes na planilha: ${missingCols.join(', ')}. Encontradas: ${sheetData.headers.join(', ')}`]);
      return;
    }
    const rowErrors = validateRows(sheetData.rows, schema);
    setValidationErrors(rowErrors);
    if (rowErrors.length === 0) setStep(2);
  };

  const handleInsert = async () => {
    if (!schema || !sheetData) return;
    setIsInserting(true);
    try {
      const data = prepareInsertData(sheetData.rows, schema);
      const tableToEndpoint: Record<string, string> = {
        segments: '/segments',
        client_profiles: '/client-profiles',
      };
      const endpoint = tableToEndpoint[schema.table] || `/${schema.table}`;
      for (const item of data) {
        await api.post(endpoint, item);
      }
      toast({ title: 'Dados importados!', description: `${sheetData.rows.length} registros inseridos em ${schema.label}.` });
      setStep(3);
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    } finally {
      setIsInserting(false);
    }
  };

  const filteredHeaders = sheetData?.headers.filter(h =>
    schema ? [...schema.requiredColumns, ...schema.optionalColumns].includes(h) : true
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-xl font-semibold">Conectar Google Sheets</h2>
      </div>

      <ImportStepIndicator steps={STEPS} currentStep={step} />

      {/* Step 0: URL input */}
      {step === 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" /> URL da Planilha
              </CardTitle>
              <CardDescription>
                Compartilhe sua planilha com nosso leitor e cole o link abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step-by-step guide */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium">Como conectar sua planilha:</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Abra a planilha no Google Sheets</li>
                  <li>
                    Clique em <strong>Compartilhar</strong> e adicione o email abaixo como <strong>Leitor</strong>:
                  </li>
                </ol>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <code className="text-xs flex-1 truncate text-foreground">{SERVICE_ACCOUNT_EMAIL}</code>
                  <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={copyEmail}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <ol start={3} className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Cole o link da planilha abaixo</li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Os dados são copiados uma vez, não sincronizados. Você pode remover o compartilhamento após a importação.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="sheet-url">URL do Google Sheets</Label>
                <Input
                  id="sheet-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-name">Nome da aba (opcional)</Label>
                <Input
                  id="sheet-name"
                  placeholder="Sheet1"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Deixe vazio para usar a primeira aba.</p>
              </div>

              {error && (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  {onSwitchToCsv && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                      <p className="text-sm font-medium">Alternativa: exporte como CSV</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>No Google Sheets, vá em <strong>Arquivo → Fazer download → CSV (.csv)</strong></li>
                        <li>Use o importador CSV para carregar o arquivo</li>
                      </ol>
                      <Button variant="outline" size="sm" onClick={onSwitchToCsv}>
                        <Upload className="h-4 w-4 mr-1" /> Importar via CSV
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={fetchSheet} disabled={!url.includes('docs.google.com/spreadsheets') || isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Buscando...</> : <><FileSpreadsheet className="h-4 w-4 mr-1" /> Buscar dados</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 1: Map to table */}
      {step === 1 && sheetData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapear para tabela</CardTitle>
              <CardDescription>
                Planilha carregada com {sheetData.rows.length} registros e colunas: {sheetData.headers.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tabela destino</Label>
                <Select value={selectedTable || ''} onValueChange={v => setSelectedTable(v as ImportTable)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a tabela..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_SCHEMAS.map(s => (
                      <SelectItem key={s.table} value={s.table}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {schema && (
                <p className="text-xs text-muted-foreground">
                  Colunas necessárias: <span className="font-mono">{schema.requiredColumns.join(', ')}</span>
                </p>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="text-sm space-y-1 mt-1">
                      {validationErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep(0); setSheetData(null); setError(''); }}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Trocar planilha
                </Button>
                <Button disabled={!selectedTable} onClick={handleMapAndValidate}>
                  <ArrowRight className="h-4 w-4 mr-1" /> Validar e prosseguir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && sheetData && schema && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {sheetData.rows.length} registros prontos para <strong>{schema.label}</strong>
          </p>
          <CsvPreviewTable headers={filteredHeaders} rows={sheetData.rows} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button onClick={handleInsert} disabled={isInserting}>
              {isInserting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando...</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar importação</>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && schema && sheetData && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">{sheetData.rows.length} registros importados!</h3>
          <p className="text-sm text-muted-foreground">Dados inseridos em {schema.label}.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setStep(0); setSelectedTable(null); setSheetData(null); }}>
              Importar outra tabela
            </Button>
            <Button onClick={onComplete}>Finalizar Setup</Button>
          </div>
        </div>
      )}
    </div>
  );
}
