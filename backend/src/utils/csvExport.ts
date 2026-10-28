/**
 * Helper to serialize tabular data to RFC 4180 compliant CSV format
 */
export function generateCsv(headers: { key: string; label: string }[], rows: Record<string, any>[]): string {
  const headerLine = headers.map((h) => escapeCsvValue(h.label)).join(',');
  const rowLines = rows.map((row) => {
    return headers
      .map((h) => {
        const val = row[h.key];
        return escapeCsvValue(val);
      })
      .join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  if (val instanceof Date) return `"${val.toISOString().split('T')[0]}"`;
  const str = val.toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
