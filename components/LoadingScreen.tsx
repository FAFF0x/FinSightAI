import React from 'react';
import { Loader2, BrainCircuit, LineChart } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
        <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
           <BrainCircuit className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
      </div>
      
      <h2 className="mt-8 text-2xl font-bold text-slate-800">
        Analisi Finanziaria in corso
      </h2>
      <p className="text-slate-500 mt-2 text-center max-w-md">
        L'intelligenza artificiale sta elaborando i dati, calcolando gli indici e identificando i trend strategici...
      </p>

      <div className="mt-8 flex gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" /> Elaborazione Dati
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-sm font-medium">
          <LineChart className="w-4 h-4" /> Generazione Grafici
        </div>
      </div>
    </div>
  );
};
