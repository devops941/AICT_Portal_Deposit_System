"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsv = generateCsv;
function generateCsv(headers, rows) {
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
function escapeCsvValue(val) {
    if (val === null || val === undefined)
        return '""';
    if (val instanceof Date)
        return `"${val.toISOString().split('T')[0]}"`;
    const str = val.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
}
