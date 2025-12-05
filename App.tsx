
import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingScreen } from './components/LoadingScreen';
import { Report } from './components/Report';
import { processFinancialFile } from './services/excelService';
import { analyzeFinancialData } from './services/geminiService';
import { AnalysisStatus, FinancialAnalysis, Language } from './types';
import { BarChart3, Globe, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('it');

  const handleFileSelect = async (file: File) => {
    setStatus('parsing');
    setError(null);
    try {
      // 1. Parse File (Excel to JSON or PDF to Base64)
      const processedFile = await processFinancialFile(file);
      
      // 2. Analyze with AI (Pass selected language)
      setStatus('analyzing');
      const result = await analyzeFinancialData(processedFile, language);
      
      // 3. Complete
      setAnalysis(result);
      setStatus('complete');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Si è verificato un errore imprevisto.");
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <BarChart3 size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">FinSight<span className="text-blue-600">AI</span></span>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector in Navbar for Quick Access */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Globe size={16} className="text-slate-500" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-slate-100 rounded-full text-slate-500">v1.2</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="transition-all duration-500">
        {status === 'idle' && (
          <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                Trasforma i tuoi dati in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Decisioni Strategiche</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Carica il tuo bilancio o file Excel finanziario. La nostra AI analizzerà i dati, calcolerà i KPI e genererà un report professionale in secondi.
              </p>
            </div>
            
            {/* Mobile Language Selector */}
             <div className="sm:hidden mb-6 flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm w-full max-w-xs">
                  <Globe size={18} className="text-slate-500" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 w-full focus:ring-0"
                  >
                    <option value="it">Report in Italiano</option>
                    <option value="en">Report in English</option>
                    <option value="es">Report in Español</option>
                    <option value="fr">Report in Français</option>
                    <option value="de">Report in Deutsch</option>
                  </select>
              </div>
            
            <div className="w-full max-w-xl">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl text-center">
                <div className="p-4">
                    <div className="font-bold text-slate-800 mb-1">Analisi Istantanea</div>
                    <p className="text-sm text-slate-500">Dal file grezzo a insight completi in meno di 30 secondi.</p>
                </div>
                 <div className="p-4">
                    <div className="font-bold text-slate-800 mb-1">Grafici Intelligenti</div>
                    <p className="text-sm text-slate-500">Visualizzazioni automatiche di trend e anomalie storiche.</p>
                </div>
                 <div className="p-4">
                    <div className="font-bold text-slate-800 mb-1">Report Export</div>
                    <p className="text-sm text-slate-500">Scarica presentazioni PDF pronte per il board.</p>
                </div>
            </div>
          </div>
        )}

        {(status === 'parsing' || status === 'analyzing') && (
          <LoadingScreen />
        )}

        {status === 'complete' && analysis && (
          <Report data={analysis} onReset={handleReset} language={language} />
        )}

        {status === 'error' && (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-white border border-rose-200 rounded-2xl shadow-lg text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Errore durante l'analisi</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
                <button 
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                Riprova
                </button>
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                 >
                    Ottieni API Key
                 </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
