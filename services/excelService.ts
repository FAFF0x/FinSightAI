import * as XLSX from 'xlsx';

export interface ProcessedFile {
  fileName: string;
  mimeType: string;
  data: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Errore nella conversione del file."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const processFinancialFile = async (file: File): Promise<ProcessedFile> => {
  
  // HANDLE PDF
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const base64Data = await fileToBase64(file);
    return {
      fileName: file.name,
      mimeType: 'application/pdf',
      data: base64Data
    };
  }

  // HANDLE EXCEL / CSV
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (workbook.SheetNames.length === 0) {
            reject(new Error(`Il file ${file.name} non contiene fogli.`));
            return;
        }

        let combinedData = "";

        // Iterate over ALL sheets
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            
            // Extract as Matrix (Array of Arrays)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
            });

            // Only append sheets that have data
            if (jsonData.length > 0) {
                combinedData += `\n--- SHEET: "${sheetName}" ---\n`;
                combinedData += JSON.stringify(jsonData, null, 2);
                combinedData += `\n`;
            }
        }

        if (combinedData.trim().length === 0) {
            reject(new Error(`Il file ${file.name} sembra vuoto.`));
            return;
        }

        resolve({
          fileName: file.name,
          mimeType: 'text/plain',
          data: combinedData
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(new Error("Errore durante la lettura del file."));
    reader.readAsArrayBuffer(file);
  });
};

export const processAllFiles = async (files: File[]): Promise<ProcessedFile[]> => {
    return Promise.all(files.map(file => processFinancialFile(file)));
};