import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.join('c:/Users/Desarrollo/Desktop/Dev/saas/GC-CPO', 'AVALES VERTICALES 06 DE MAYO 2026.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log('Hojas encontradas:', sheetNames);

  sheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n--- Hoja: ${sheetName} ---`);
    console.log(`Total filas: ${data.length}`);
    if (data.length > 0) {
      console.log('Primera fila:', JSON.stringify(data[0], null, 2));
      const cols = Object.keys(data[0] as object);
      console.log('Columnas:', cols.join(', '));
    }
  });
} catch (error: any) {
  console.error('Error al leer el archivo:', error.message);
}
