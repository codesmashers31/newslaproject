import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const uploadsDir = './uploads';

const inspect = () => {
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
  console.log(`Found ${files.length} Excel files in uploads.`);
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    if (data.length > 0) {
      console.log(`\nFile: ${file}`);
      console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
      console.log(`Rows count: ${data.length}`);
      console.log(`Sample Row:`, data[0]);
    }
  }
};

inspect();
