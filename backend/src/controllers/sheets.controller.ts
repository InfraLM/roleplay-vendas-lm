import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

export async function fetchSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const { spreadsheetUrl, sheetName } = req.body;

    if (!spreadsheetUrl) {
      throw new AppError(400, 'URL da planilha é obrigatória');
    }

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new AppError(400, 'URL da planilha inválida');
    }

    const spreadsheetId = match[1];
    const sheet = sheetName || 'Sheet1';

    // Try public access first
    const publicUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

    const response = await fetch(publicUrl);

    if (response.ok) {
      const csv = await response.text();
      const rows = parseCsv(csv);
      if (rows.length === 0) throw new AppError(400, 'Planilha vazia');

      const headers = rows[0];
      const data = rows.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });

      return res.json({ headers, data, rows: rows.length - 1 });
    }

    throw new AppError(400, 'Não foi possível acessar a planilha. Verifique se ela está compartilhada publicamente ou tente importar por CSV.');
  } catch (err) { next(err); }
}

function parseCsv(csv: string): string[][] {
  const lines = csv.split('\n').filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}
