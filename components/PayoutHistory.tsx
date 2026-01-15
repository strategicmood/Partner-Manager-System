import React, { useState, useMemo } from 'react';
import { PayoutRecord } from '../types';
import { formatCurrency } from '../services/logic';
import { CheckCircle, Clock, FileText, Filter, CalendarRange, Wallet, AlertCircle } from 'lucide-react';

interface PayoutHistoryProps {
  payouts: PayoutRecord[];
  onUpdatePaymentDate: (payoutId: string, date: string) => void;
}

const PayoutHistory: React.FC<PayoutHistoryProps> = ({ payouts, onUpdatePaymentDate }) => {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Pagado'>('Todos');

  // --- 1. Quarter & Dashboard Logic ---
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // Define Q Start/End dates
    const startQ = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const endQ = new Date(currentYear, currentQuarter * 3, 0);

    // Metrics
    let pendingTotal = 0;
    let paidThisQuarter = 0;
    let generatedThisQuarter = 0;

    payouts.forEach(p => {
        // 1. Total Pending (Global liability)
        if (p.status === 'Pendiente') {
            pendingTotal += p.totalAmount;
        }

        // 2. Paid this Quarter (Cash flow out)
        if (p.status === 'Pagado' && p.paymentDate) {
            const pDate = new Date(p.paymentDate);
            if (pDate >= startQ && pDate <= endQ) {
                paidThisQuarter += p.totalAmount;
            }
        }

        // 3. Generated this Quarter (Volume)
        const gDate = new Date(p.dateGenerated);
        if (gDate >= startQ && gDate <= endQ) {
            generatedThisQuarter += p.totalAmount;
        }
    });

    return {
        qLabel: `Q${currentQuarter} ${currentYear}`,
        pendingTotal,
        paidThisQuarter,
        generatedThisQuarter
    };
  }, [payouts]);


  // --- 2. Filter Logic ---
  const filteredPayouts = payouts.filter(p => {
      if (statusFilter === 'Todos') return true;
      return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Administración de Pagos</h2>
        <p className="text-slate-500">Gestione el estado de las liquidaciones y registre la fecha efectiva de pago.</p>
      </header>

      {/* --- MINI DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Pending (Action needed) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-[#ed8b01] flex items-start justify-between">
              <div>
                  <p className="text-slate-500 text-sm font-medium">Pendiente de Pago (Total)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(dashboardMetrics.pendingTotal)}</h3>
                  <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Requiere atención
                  </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-[#ed8b01]">
                  <Wallet size={20} />
              </div>
          </div>

          {/* Card 2: Paid in Quarter */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500 flex items-start justify-between">
               <div>
                  <p className="text-slate-500 text-sm font-medium">Liquidado en {dashboardMetrics.qLabel}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(dashboardMetrics.paidThisQuarter)}</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Pagado este trimestre
                  </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <CalendarRange size={20} />
              </div>
          </div>

          {/* Card 3: Generated in Quarter */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-slate-400 flex items-start justify-between">
               <div>
                  <p className="text-slate-500 text-sm font-medium">Volumen Generado ({dashboardMetrics.qLabel})</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(dashboardMetrics.generatedThisQuarter)}</h3>
                  <p className="text-xs text-slate-400 mt-2">Facturas creadas este Q</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <FileText size={20} />
              </div>
          </div>
      </div>

      {/* --- FILTER & TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-700">Histórico de Facturas</h3>
            
            {/* Filter Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                <button 
                    onClick={() => setStatusFilter('Todos')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${statusFilter === 'Todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setStatusFilter('Pendiente')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${statusFilter === 'Pendiente' ? 'bg-[#ed8b01] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pendientes
                </button>
                <button 
                    onClick={() => setStatusFilter('Pagado')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${statusFilter === 'Pagado' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pagados
                </button>
            </div>
        </div>

        {filteredPayouts.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron liquidaciones con el filtro seleccionado.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium">
                  <tr>
                  <th className="px-6 py-4 whitespace-nowrap">ID Liquidación</th>
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4 whitespace-nowrap">F. Generación</th>
                  <th className="px-6 py-4 whitespace-nowrap">F. Pago (Admin)</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600">{payout.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{payout.partnerName}</td>
                      <td className="px-6 py-4 text-slate-500">{payout.dateGenerated}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                           <input 
                              type="date"
                              value={payout.paymentDate || ''}
                              onChange={(e) => onUpdatePaymentDate(payout.id, e.target.value)}
                              className={`
                                border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#ed8b01] focus:border-[#ed8b01] focus:outline-none transition-colors w-full cursor-pointer
                                ${payout.paymentDate ? 'border-green-300 bg-green-50 text-green-800 font-medium' : 'border-slate-300 text-slate-600'}
                              `}
                           />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{formatCurrency(payout.totalAmount)}</td>
                      <td className="px-6 py-4 text-center">
                          <span 
                              className={`
                                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all
                                  ${payout.status === 'Pagado' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-amber-100 text-amber-700'}
                              `}
                          >
                              {payout.status === 'Pagado' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                              {payout.status}
                          </span>
                      </td>
                  </tr>
                  ))}
              </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default PayoutHistory;