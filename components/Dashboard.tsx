
import React, { useState } from 'react';
import { Subscription, GoalTarget, Partner } from '../types';
import { formatCurrency } from '../services/logic';
import { Wallet, Users as UsersIcon, TrendingUp, AlertTriangle, UserPlus, UserMinus, Calendar, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  subscriptions: Subscription[];
  partners: Partner[];
  goals: GoalTarget[];
}

type DateFilter = 'current_month' | 'last_month' | 'current_quarter' | 'last_quarter' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ subscriptions, partners, goals }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('current_month');

  // --- Helper to get date ranges ---
  const getDateRange = (filter: DateFilter): { start: Date; end: Date; label: string } => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (filter) {
        case 'current_month':
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            return { start, end, label: 'Este Mes' };
        case 'last_month':
            start.setMonth(start.getMonth() - 1);
            start.setDate(1);
            end.setDate(0);
            return { start, end, label: 'Mes Pasado' };
        case 'current_quarter':
            start.setMonth(Math.floor(start.getMonth() / 3) * 3);
            start.setDate(1);
            const qEndMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
            end.setMonth(qEndMonth);
            end.setDate(0);
            return { start, end, label: 'Este Trimestre' };
        case 'last_quarter':
            const currentQStartMonth = Math.floor(now.getMonth() / 3) * 3;
            start.setMonth(currentQStartMonth - 3);
            start.setDate(1);
            end.setMonth(currentQStartMonth);
            end.setDate(0);
            return { start, end, label: 'Trimestre Pasado' };
        case 'year':
            start.setMonth(0, 1);
            end.setMonth(11, 31);
            return { start, end, label: 'Este Año' };
        default:
            return { start, end, label: 'Personalizado' };
    }
  };

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = getDateRange(dateFilter);

  // --- Metrics Calculation (Global / Range) ---

  // 1. Total MRR (Global Active)
  const totalMRR = subscriptions.filter(s => s.Estado === 'Activo').reduce((acc, curr) => acc + curr.Cuota, 0);
  
  // 2. Total Clients (Global)
  const totalClients = subscriptions.length;
  
  // 3. Highs (Altas) in Range
  const highs = subscriptions.filter(s => {
    const d = new Date(s.Fecha_Inicio);
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  // 4. Lows (Bajas) in Range
  const lows = subscriptions.filter(s => {
    if (s.Estado !== 'Cancelado' || !s.Fecha_Fin) return false;
    const d = new Date(s.Fecha_Fin);
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  // 5. Lockup Logic
  const lockupClients = subscriptions.filter(s => {
      if (s.Estado !== 'Activo') return false;
      const start = new Date(s.Fecha_Inicio);
      const diffMonths = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return diffMonths < 6;
  }).length;

  // --- GOAL COMPARISON LOGIC (Auto-detect Current Quarter) ---
  const now = new Date();
  const currentMonth = now.getMonth();
  
  let currentPeriodId = 'Annual';
  if (currentMonth >= 0 && currentMonth <= 2) currentPeriodId = 'Q1';
  else if (currentMonth >= 3 && currentMonth <= 5) currentPeriodId = 'Q2';
  else if (currentMonth >= 6 && currentMonth <= 8) currentPeriodId = 'Q3';
  else currentPeriodId = 'Q4';

  const comparisonGoal = goals.find(g => g.id === currentPeriodId) || goals[0];

  // Calculate stats strictly for the current quarter for comparison
  const qStart = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3, 1);
  const qEnd = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3 + 3, 0);

  const actualNewClientsQ = subscriptions.filter(s => {
      const d = new Date(s.Fecha_Inicio);
      return d >= qStart && d <= qEnd;
  }).length;

  const actualNewPartnersQ = partners.filter(p => {
      const d = new Date(p.Fecha_Alta);
      return d >= qStart && d <= qEnd;
  }).length;

  const actualNewMRRQ = subscriptions.filter(s => {
      const d = new Date(s.Fecha_Inicio);
      return d >= qStart && d <= qEnd && s.Estado === 'Activo';
  }).reduce((acc, s) => acc + s.Cuota, 0);

  // Chart Data
  const chartData = [
    { name: 'P1', amt: totalMRR * 0.8 },
    { name: 'P2', amt: totalMRR * 0.9 },
    { name: 'Actual', amt: totalMRR },
    { name: 'Proj', amt: totalMRR * 1.1 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">🏟️ Arena: Visión Global</h2>
        
        {/* Date Filter Control */}
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
            <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-2" />
            <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none py-1 pr-8 cursor-pointer"
            >
                <option value="current_month">Este Mes</option>
                <option value="last_month">Mes Pasado</option>
                <option value="current_quarter">Este Trimestre</option>
                <option value="last_quarter">Trimestre Pasado</option>
                <option value="year">Este Año</option>
            </select>
        </div>
      </header>
      
      {/* SECTION 1: KPIS VS GOALS (Auto-Quarter) */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-6">
              <Target className="text-indigo-400" />
              <h3 className="font-bold text-lg">Rendimiento vs Objetivos ({comparisonGoal.label})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Clients Progress */}
              <div>
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">Altas Clientes</span>
                      <span className="font-bold">{actualNewClientsQ} / {comparisonGoal.newClientsTarget}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((actualNewClientsQ / comparisonGoal.newClientsTarget) * 100, 100)}%` }}
                      ></div>
                  </div>
              </div>

               {/* Partners Progress */}
               <div>
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">Nuevos Partners</span>
                      <span className="font-bold">{actualNewPartnersQ} / {comparisonGoal.newPartnersTarget}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((actualNewPartnersQ / comparisonGoal.newPartnersTarget) * 100, 100)}%` }}
                      ></div>
                  </div>
              </div>

               {/* MRR Progress */}
               <div>
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-300 text-sm">MRR Nuevo</span>
                      <span className="font-bold">{formatCurrency(actualNewMRRQ)} / {formatCurrency(comparisonGoal.mrrTarget)}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-indigo-500 h-3 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((actualNewMRRQ / comparisonGoal.mrrTarget) * 100, 100)}%` }}
                      ></div>
                  </div>
              </div>
          </div>
      </section>

      {/* SECTION 2: CURRENT STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">MRR Canal</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalMRR)}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Wallet size={20} /></div>
          </div>
        </div>
        
        {/* Total Clients */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Clientes Totales</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalClients}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><UsersIcon size={20} /></div>
          </div>
        </div>

        {/* Highs (Filtered) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Altas ({rangeLabel})</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                 {highs} <span className="text-xs font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">+ Nuevos</span>
              </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><UserPlus size={20} /></div>
          </div>
        </div>

        {/* Lows (Filtered) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-rose-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Bajas ({rangeLabel})</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                {lows} <span className="text-xs font-normal text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">- Cancelados</span>
              </h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><UserMinus size={20} /></div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {lockupClients > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Alerta de Salud: Clientes en Lock-up</h4>
            <p className="text-amber-700 text-sm mt-1">
              Tienes {lockupClients} clientes nuevos en periodo de retención. Su comisión se acumula pero no es liquidable hasta el mes 6.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 text-sm flex items-center gap-2">
           <TrendingUp size={16}/> Toda la cartera es madura ({'>'}6 meses) y liquidable.
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-6">Evolución de Pagos ({rangeLabel})</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: '#f1f5f9'}}
              />
              <Bar dataKey="amt" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
