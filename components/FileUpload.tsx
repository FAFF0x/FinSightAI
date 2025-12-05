import React, { useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isDragOver?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv') || file.name.endsWith('.pdf')) {
        onFileSelect(file);
      } else {
        alert("Per favore carica un file Excel (.xlsx, .xls), CSV o PDF.");
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={clsx(
        "relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
        isDragOver
          ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
          : "border-slate-300 hover:border-slate-400 bg-white"
      )}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        accept=".xlsx,.xls,.csv,.pdf"
      />
      
      <div className="flex flex-col items-center gap-4 text-center p-6">
        <div className={clsx(
          "p-4 rounded-full transition-colors duration-300",
          isDragOver ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
        )}>
          {isDragOver ? <FileText size={32} /> : <UploadCloud size={32} />}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            Carica bilancio o dati finanziari
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Trascina qui il file Excel o PDF
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
            <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Excel / CSV</span>
            <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">PDF</span>
        </div>
      </div>
    </div>
  );
};