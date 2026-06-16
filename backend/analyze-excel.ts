import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.join(__dirname, '..', 'ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');

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
      
      // Intentar identificar la columna de gestor
      const firstRow = data[0];
      const cols = Object.keys(firstRow as object);
      console.log('Columnas:', cols.join(', '));
      
      const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'));
      if (gestorCol) {
          const gestores = [...new Set(data.map((row: any) => row[gestorCol]))].filter(Boolean);
          console.log(`Gestores encontrados (${gestores.length}):`, gestores);
      }
    }
  });
} catch (error: any) {
  console.error('Error al leer el archivo:', error.message);
}
