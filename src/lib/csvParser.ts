export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/);
  
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ['O arquivo deve ter pelo menos um cabeçalho e uma linha de dados.'] };
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return { headers, rows, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

export type ImportTable = 'segments' | 'client_profiles' | 'prizes';

export interface TableSchema {
  table: ImportTable;
  label: string;
  requiredColumns: string[];
  optionalColumns: string[];
  description: string;
}

export const TABLE_SCHEMAS: TableSchema[] = [
  {
    table: 'segments',
    label: 'Produtos',
    requiredColumns: ['name', 'prompt_context'],
    optionalColumns: ['description'],
    description: 'Produtos para simulações de roleplay.',
  },
  {
    table: 'client_profiles',
    label: 'Perfis de Clientes',
    requiredColumns: ['display_name', 'name', 'objection_style'],
    optionalColumns: ['whatsapp_style'],
    description: 'Perfis de clientes simulados. O campo "name" deve ser: soft, hard, chato ou ultra_hard.',
  },
  {
    table: 'prizes',
    label: 'Prêmios',
    requiredColumns: ['name', 'vouchers_required'],
    optionalColumns: ['description', 'category'],
    description: 'Prêmios que podem ser resgatados com vouchers.',
  },
];

export function validateRows(rows: Record<string, string>[], schema: TableSchema): string[] {
  const errors: string[] = [];
  const validProfileNames = ['soft', 'hard', 'chato', 'ultra_hard'];

  rows.forEach((row, idx) => {
    schema.requiredColumns.forEach(col => {
      if (!row[col] || row[col].trim() === '') {
        errors.push(`Linha ${idx + 1}: campo obrigatório "${col}" está vazio.`);
      }
    });

    if (schema.table === 'client_profiles' && row.name && !validProfileNames.includes(row.name.trim())) {
      errors.push(`Linha ${idx + 1}: "name" deve ser um de: ${validProfileNames.join(', ')}. Encontrado: "${row.name}".`);
    }

    if (schema.table === 'prizes' && row.vouchers_required) {
      const num = Number(row.vouchers_required);
      if (isNaN(num) || num < 1) {
        errors.push(`Linha ${idx + 1}: "vouchers_required" deve ser um número >= 1.`);
      }
    }
  });

  return errors;
}

export function prepareInsertData(rows: Record<string, string>[], schema: TableSchema): Record<string, unknown>[] {
  return rows.map(row => {
    const data: Record<string, unknown> = {};
    
    [...schema.requiredColumns, ...schema.optionalColumns].forEach(col => {
      if (row[col] !== undefined && row[col] !== '') {
        if (col === 'vouchers_required') {
          data[col] = Number(row[col]);
        } else if (col === 'whatsapp_style') {
          data[col] = row[col].toLowerCase() !== 'false' && row[col] !== '0';
        } else {
          data[col] = row[col];
        }
      }
    });

    // Defaults
    if (schema.table === 'client_profiles' && data.whatsapp_style === undefined) {
      data.whatsapp_style = true;
    }
    if (schema.table === 'prizes' && !data.category) {
      data.category = 'geral';
    }

    return data;
  });
}
