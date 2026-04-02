import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CsvPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}

export default function CsvPreviewTable({ headers, rows, maxRows = 5 }: CsvPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h} className="text-xs font-semibold uppercase">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map((row, idx) => (
            <TableRow key={idx}>
              {headers.map((h) => (
                <TableCell key={h} className="text-sm max-w-[200px] truncate">{row[h] || '—'}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > maxRows && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
          Mostrando {maxRows} de {rows.length} registros
        </div>
      )}
    </div>
  );
}
