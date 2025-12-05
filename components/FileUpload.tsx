import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, X, Play, Plus } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv') || file.name.endsWith('.pdf')) {
        newFiles.push(file);
      } else {
        alert(`Il file ${file.name} non è supportato. Usa PDF o Excel.`);
      }
    }
    
    // Add to existing files, avoiding duplicates by name
    setSelectedFiles(prev => {
        const combined = [...prev, ...newFiles];
        // Simple de-dupe by name
        return combined.filter((v,i,a)=>a.findIndex(t=>(t.name===v.name))===i);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
    }
  };

  return (
    <div className="w-full space-y-6">
        
        {/* Drop Zone */}
        <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
            "relative group cursor-pointer flex flex-col items-center justify-center w-full h-52 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
            isDragOver
            ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-slate-400 bg-white"
        )}
        >
        <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => processFiles(e.target.files)}
            accept=".xlsx,.xls,.csv,.pdf"
            multiple // ENABLE MULTIPLE
        />
        
        <div className="flex flex-col items-center gap-3 text-center p-6">
            <div className={clsx(
            "p-3 rounded-full transition-colors duration-300",
            isDragOver ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            )}>
            {isDragOver ? <FileText size={28} /> : <UploadCloud size={28} />}
            </div>
            <div>
            <h3 className="text-base font-semibold text-slate-700">
                Trascina qui i file o clicca per cercare
            </h3>
            <p className="text-sm text-slate-500 mt-1">
                Supporta file multipli (Excel e PDF combinati)
            </p>
            </div>
        </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                     <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">File selezionati ({selectedFiles.length})</h4>
                </div>
               
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={clsx("p-2 rounded-lg", file.name.endsWith('pdf') ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                                    {file.name.endsWith('pdf') ? <FileText size={18}/> : <FileSpreadsheet size={18}/>}
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeFile(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Main Action Button */}
                <button
                    onClick={handleStartAnalysis}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
                >
                    <Play size={20} className="fill-current" />
                    Avvia Analisi Completa
                </button>
            </div>
        )}
    </div>
  );
};
