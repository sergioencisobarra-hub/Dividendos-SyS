
import React, { useState, useMemo } from 'react';
import { MONTHS, PORTFOLIO } from './constants';
import { analyzeDividends } from './services/geminiService';
import { AnalysisSummary, DividendResult } from './types';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[currentMonthIndex]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const years = useMemo(() => Array.from({ length: 3 }, (_, i) => currentYear + i), [currentYear]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeDividends(selectedMonth, selectedYear, PORTFOLIO);
      setAnalysis(result);
    } catch (err: any) {
      setError('Error en la consulta financiera. Reintenta en unos instantes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Lógica de Calendario
  const calendarDays = useMemo(() => {
    const monthIdx = MONTHS.indexOf(selectedMonth);
    const date = new Date(selectedYear, monthIdx, 1);
    const days = [];
    
    // Obtener el primer día de la semana (ajustado a Lunes = 0)
    let firstDay = date.getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Rellenar días del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }

    // Días del mes actual
    const daysInMonth = new Date(selectedYear, monthIdx + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDateStr = `${selectedYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const payments = analysis?.results.filter(r => r.paymentDate === fullDateStr) || [];
      days.push({ day: i, dateStr: fullDateStr, payments });
    }

    return days;
  }, [selectedMonth, selectedYear, analysis]);

  return (
    <div className="min-h-screen pb-12 bg-[#f8fafc]">
      {/* Header Financiero */}
      <header className="bg-slate-900 text-white border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 h-10 w-1.5 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                DIVIDEND TRACKER <span className="bg-blue-600 px-2 py-0.5 rounded text-xs">ULTRA PRECISION</span>
              </h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Verified Corporate Actions & Spain Tax Compliance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 text-white rounded-lg border-none px-4 py-2 text-sm font-bold focus:ring-0"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-900 text-white rounded-lg border-none px-4 py-2 text-sm font-bold focus:ring-0"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                isLoading 
                ? 'bg-slate-700 text-slate-500' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isLoading ? 'Consultando...' : 'Analizar'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {error && (
          <div className="mb-8 p-4 bg-red-950 border border-red-900 text-red-200 rounded-xl text-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagos en {selectedMonth}</p>
                <p className="text-3xl font-black text-slate-900">{analysis.totalCompanies}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bruto Estimado</p>
                <p className="text-3xl font-black text-slate-900">{formatCurrency(analysis.totalGrossEur)}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-blue-900/10 border-l-4 border-l-blue-600">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Neto Final Proyectado (D+1 FX)</p>
                <p className="text-4xl font-black">{formatCurrency(analysis.totalNetEur)}</p>
              </div>
            </div>

            {/* View Selector */}
            <div className="flex justify-center mb-6">
              <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Calendario
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Detalle Lista
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              /* Vista Calendario */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Cronograma de Cobros - {selectedMonth} {selectedYear}</h3>
                  <div className="flex gap-4 text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-600"></div> Pago Confirmado</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-100 border"></div> Día Hábil</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                    <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 border-r border-slate-100 last:border-r-0">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`min-h-[120px] p-2 border-r border-b border-slate-100 last:border-r-0 flex flex-col group transition-colors ${day.day === null ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/80'}`}
                    >
                      {day.day && (
                        <>
                          <span className={`text-[10px] font-black mb-2 ${day.payments.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {String(day.day).padStart(2, '0')}
                          </span>
                          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
                            {day.payments.map((p, pIdx) => (
                              <div 
                                key={pIdx} 
                                className="bg-blue-600 text-white p-1.5 rounded-md text-[9px] font-black leading-tight shadow-sm border-l-2 border-blue-900 animate-in slide-in-from-top-1"
                                title={`${p.company}: ${formatCurrency(p.netAmountEur)}`}
                              >
                                <div className="flex justify-between items-start">
                                  <span>{p.ticker.split(':')[1] || p.ticker}</span>
                                  <span className="opacity-80">{p.netAmountEur.toFixed(0)}€</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Vista Lista (Anterior) */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                        <th className="px-8 py-4">Ticker / Empresa</th>
                        <th className="px-6 py-4">Ex-Date</th>
                        <th className="px-6 py-4">Pay-Date</th>
                        <th className="px-6 py-4">FX (D+1)</th>
                        <th className="px-6 py-4">Ret. Origen</th>
                        <th className="px-6 py-4">Ret. España</th>
                        <th className="px-8 py-4 text-right">Neto Final (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.results.length > 0 ? (
                        analysis.results.map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="font-black text-slate-900">{item.ticker}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{item.company}</div>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.exDividendDate}</td>
                            <td className="px-6 py-5 text-xs font-black text-slate-700">{item.paymentDate}</td>
                            <td className="px-6 py-5 text-xs font-mono text-blue-600 font-bold">{item.exchangeRate.toFixed(4)}</td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-black">
                                {(item.originTaxRate * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-5 text-indigo-600 font-black text-[10px]">19.0%</td>
                            <td className="px-8 py-5 text-right font-black text-slate-900 text-lg">
                              {item.netAmountEur.toFixed(2)}€
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={7} className="text-center py-20 text-slate-400 font-bold">Sin cobros confirmados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Metodología */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Protocolo de Verificación</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed italic max-w-4xl">
                Los dividendos mostrados han sido validados contra calendarios financieros reales. Se aplica la normativa de doble imposición (Origen + España 19%) y valoración de divisa D+1. 
                Los días marcados en azul en el calendario representan la fecha de abono efectivo en cuenta (Pay Date).
              </p>
            </div>
          </div>
        )}

        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
            <div className="mb-6 p-10 bg-white rounded-[50px] shadow-2xl">
              <svg className="w-24 h-24 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Proyectar Calendario</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Introduce un mes para mapear tus ingresos por dividendos</p>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 py-10 px-4 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Dividend Analytics Terminal v5.0 • Calendar Planning Engine</p>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
