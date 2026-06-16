import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = '../ASIGNACION SINEFI AVALES ABRIL 2026.xlsx';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
if (data.length > 0) {
  console.log("Excel Headers:", data[0]);
}
