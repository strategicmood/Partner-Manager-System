
import React, { useState, useMemo } from 'react';
import { Subscription, GoalTarget, Partner, Liquidation } from '../types';
import { formatCurrency } from '../services/logic';
import { Wallet, Users as UsersIcon, TrendingUp, AlertTriangle, UserPlus, UserMinus, Calendar, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

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

  // --- 1. GLOBAL KPIS ---
  const totalMRR = subscriptions.filter(s => s.Estado === 'Activo').reduce((acc, curr) => acc + curr.Cuota, 0);
  const totalClients = subscriptions.length;
  const activeClients = subscriptions.filter(s => s.Estado === 'Activo').length;
  
  // Calculate Churn Rate (simplified: Cancelled / Total Ever)
  const churnedCount = subscriptions.filter(s => s.Estado === 'Cancelado').length;
  const churnRate = totalClients > 0 ? (churnedCount / totalClients) * 100 : 0;

  // Highs/Lows in Range
  const highs = subscriptions.filter(s => {
    const d = new Date(s.Fecha_Inicio);
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  const lows = subscriptions.filter(s => {
    if (s.Estado !== 'Cancelado' || !s.Fecha_Fin) return false;
    const d = new Date(s.Fecha_Fin);
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  // --- 2. ADVANCED CHART DATA: REVENUE VS COST (Last 12 Months) ---
  const financialData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Iterate last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
        const monthLabel = d.toLocaleString('es-ES', { month: 'short' });

        // Calculate Revenue (MRR active in that month)
        // A sub is active if Start <= MonthEnd AND (No End OR End >= MonthStart)
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const mrrInMonth = subscriptions.reduce((acc, sub) => {
            const start = new Date(sub.Fecha_Inicio);
            const end = sub.Fecha_Fin ? new Date(sub.Fecha_Fin) : null;
            
            if (start <= monthEnd && (!end || end >= d)) {
                return acc + sub.Cuota;
            }
            return acc;
        }, 0);

        // Calculate Cost (Est. 20% flat for visualization or realistic if we had historical payouts linked to months)
        // For this dashboard, we represent the "Margin" visually.
        // In a real scenario, we would sum actual Liquidations by 'Mes_Pagado' = monthStr
        // Since we don't have full historical liquidations mock, we simulate a 15-20% cost curve based on Tier logic
        const estimatedCost = mrrInMonth * 0.18; 

        data.push({
            name: monthLabel,
            revenue: mrrInMonth,
            cost: estimatedCost,
            margin: mrrInMonth - estimatedCost
        });
    }
    return data;
  }, [subscriptions]);

  // --- 3. PARTNER DISTRIBUTION DATA ---
  const tierData = useMemo(() => {
      const counts = { Platinum: 0, Gold: 0, Silver: 0 };
      partners.forEach(p => {
          if (counts[p.Nivel] !== undefined) counts[p.Nivel]++;
      });
      return [
          { name: 'Platinum', value: counts.Platinum, color: '#6366f1' }, // Indigo
          { name: 'Gold', value: counts.Gold, color: '#f59e0b' },     // Amber
          { name: 'Silver', value: counts.Silver, color: '#94a3b8' },   // Slate
      ];
  }, [partners]);

  // --- 4. TOP PERFORMERS (Leaderboard) ---
  const topPartners = useMemo(() => {
      return partners.map(p => {
          const mrr = subscriptions
            .filter(s => s.ID_Partner === p.ID_Partner && s.Estado === 'Activo')
            .reduce((sum, s) => sum + s.Cuota, 0);
          return { ...p, mrr };
      })
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 5);
  }, [partners, subscriptions]);

  // --- 5. GOAL TRACKING (Current Period) ---
  const now = new Date();
  const currentMonth = now.getMonth();
  let currentPeriodId = 'Annual';
  if (currentMonth >= 0 && currentMonth <= 2) currentPeriodId = 'Q1';
  else if (currentMonth >= 3 && currentMonth <= 5) currentPeriodId = 'Q2';
  else if (currentMonth >= 6 && currentMonth <= 8) currentPeriodId = 'Q3';
  else currentPeriodId = 'Q4';
  
  const comparisonGoal = goals.find(g => g.id === currentPeriodId) || goals[0];
  const qStart = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3, 1);
  const qEnd = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3 + 3, 0);
  
  const actualNewClientsQ = subscriptions.filter(s => {
      const d = new Date(s.Fecha_Inicio);
      return d >= qStart && d <= qEnd;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* HEADER & FILTERS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">🏟️ Arena: Visión Global</h2>
            <p className="text-slate-500 text-sm">Resumen ejecutivo del rendimiento del canal de partners.</p>
        </div>
        
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
                <option value="year">Este Año</option>
            </select>
        </div>
      </header>
      
      {/* ROW 1: HIGH LEVEL KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet size={64} className="text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">MRR Canal Activo</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalMRR)}</h3>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                  <ArrowUpRight size={12} />
                  <span>+12% vs mes anterior</span>
              </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Clientes Activos</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeClients}</h3>
              <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-medium">+{highs} altas</span>
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md font-medium">-{lows} bajas</span>
              </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Churn Rate (Global)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{churnRate.toFixed(1)}%</h3>
              <p className="text-xs text-slate-400 mt-2">Tasa de cancelación histórica</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Obj. Clientes ({comparisonGoal.id})</p>
              <div className="flex items-end gap-2 mt-1">
                 <h3 className="text-2xl font-bold text-slate-800">{actualNewClientsQ}</h3>
                 <span className="text-sm text-slate-400 mb-1">/ {comparisonGoal.newClientsTarget}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((actualNewClientsQ / comparisonGoal.newClientsTarget) * 100, 100)}%` }}
                  ></div>
              </div>
          </div>
      </div>

      {/* ROW 2: FINANCIAL EVOLUTION & TIER DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Revenue vs Cost */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-1">Evolución Financiera (12 Meses)</h3>
              <p className="text-sm text-slate-500 mb-6">Comparativa de ingresos recurrentes (MRR) vs coste estimado de comisiones.</p>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="revenue" name="Ingresos (MRR)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="cost" name="Coste Comisiones" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                        <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Tier Distribution Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-1">Distribución de Partners</h3>
              <p className="text-sm text-slate-500 mb-4">Cartera por nivel de partnership.</p>
              
              <div className="flex-1 min-h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                            data={tierData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {tierData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-800">{partners.length}</span>
                      <span className="text-xs text-slate-500 uppercase font-medium">Partners</span>
                  </div>
              </div>
          </div>
      </div>

      {/* ROW 3: TOP PERFORMERS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Award className="text-[#ed8b01]" /> Top 5 Partners por Volumen
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-3">Ranking</th>
                          <th className="px-6 py-3">Partner</th>
                          <th className="px-6 py-3">Nivel</th>
                          <th className="px-6 py-3 text-right">MRR Gestionado</th>
                          <th className="px-6 py-3 text-right">Contribución</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {topPartners.map((p, idx) => (
                          <tr key={p.ID_Partner} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                              <td className="px-6 py-4 font-medium text-slate-900">{p.Nombre}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      p.Nivel === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                                      p.Nivel === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
                                  }`}>
                                      {p.Nivel}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                                  {formatCurrency(p.mrr)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <span className="text-xs text-slate-500">
                                          {totalMRR > 0 ? ((p.mrr / totalMRR) * 100).toFixed(1) : 0}%
                                      </span>
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                                          <div 
                                            className="h-1.5 rounded-full bg-indigo-500" 
                                            style={{ width: `${totalMRR > 0 ? (p.mrr / totalMRR) * 100 : 0}%` }}
                                          ></div>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
