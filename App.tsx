
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LiquidationBuilder from './components/LiquidationBuilder';
import Dashboard from './components/Dashboard';
import PayoutHistory from './components/PayoutHistory';
import GoalsConfig from './components/GoalsConfig';
import CommercialConditions from './components/CommercialConditions';
import PartnerDetailView from './components/PartnerDetailView';
import { MOCK_PARTNERS, MOCK_SUBSCRIPTIONS, MOCK_LIQUIDATIONS, MOCK_PAYOUTS, INITIAL_GOALS, MOCK_PLANS } from './constants';
import { fetchAndParseData } from './services/sheets';
import { formatCurrency } from './services/logic';
import { Search, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight, Briefcase, Filter, Settings as SettingsIcon } from 'lucide-react';
import { PayoutRecord, Liquidation, GoalTarget, AppSettings, CommercialPlan, Partner, Subscription, Company } from './types';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [liquidations, setLiquidations] = useState<Liquidation[]>(MOCK_LIQUIDATIONS);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(MOCK_PAYOUTS);
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [commercialPlans, setCommercialPlans] = useState<CommercialPlan[]>(MOCK_PLANS);
  const [goals, setGoals] = useState<GoalTarget[]>(INITIAL_GOALS);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    logoUrl: null,
    brandColor: '#ed8b01',
    sheetsUrls: {
        partners: '',
        subscriptions: '',
        liquidations: '',
        plans: '',
        companies: '',
        goals: ''
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const syncData = async () => {
      setIsLoading(true);
      setSyncError(null);
      try {
          const res = await fetchAndParseData(appSettings.sheetsUrls);
          if (res.error) {
              setSyncError(res.error);
          } else {
              if (res.partners.length) setPartners(res.partners);
              if (res.companies.length) setCompanies(res.companies);
              if (res.subscriptions.length) setSubscriptions(res.subscriptions);
              if (res.liquidations.length) setLiquidations(res.liquidations);
              if (res.plans.length) setCommercialPlans(res.plans);
              if (res.goals.length) setGoals(res.goals);
              setLastSync(new Date().toLocaleTimeString());
          }
      } catch (e) {
          setSyncError("Error crítico de conexión.");
      }
      setIsLoading(false);
  };

  useEffect(() => {
    // Solo sincronizar si hay URLs configuradas, si no, usar mocks
    if (Object.values(appSettings.sheetsUrls).some(url => url !== '')) {
        syncData();
    }
  }, []);

  const handleRegisterLiquidation = (newItems: Liquidation[], newPayout: PayoutRecord) => {
    setLiquidations(prev => [...prev, ...newItems]);
    setPayouts(prev => [newPayout, ...prev]);
  };

  const handleUpdatePaymentDate = (payoutId: string, date: string) => {
    setPayouts(prev => prev.map(p => 
        p.id === payoutId 
            ? { ...p, paymentDate: date, status: date ? 'Pagado' : 'Pendiente' } 
            : p
    ));
  };

  const handleAddPlan = (newPlan: CommercialPlan) => {
    setCommercialPlans(prev => [newPlan, ...prev]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': 
        return <Dashboard subscriptions={subscriptions} partners={partners} goals={goals} />;
      
      case 'goals':
        return <GoalsConfig goals={goals} onUpdateGoals={setGoals} />;
      
      case 'partners': 
        if (selectedPartner) {
            return (
                <PartnerDetailView 
                    partner={selectedPartner} 
                    subscriptions={subscriptions.map(s => {
                        const comp = companies.find(c => c.id === s.id_cliente);
                        return { ...s, Cliente: comp?.nombre_empresa || 'Cliente Desconocido', ID_Partner: comp?.id_partner || '' };
                    })} 
                    liquidations={liquidations} 
                    onBack={() => setSelectedPartner(null)} 
                />
            );
        }
        return <PartnersView />;
      
      case 'clients':
        return <ClientsView />;
      
      case 'conditions':
        return <CommercialConditions plans={commercialPlans} onAddPlan={handleAddPlan} />;
      
      case 'liquidations': 
        return (
            <LiquidationBuilder 
                partners={partners} 
                subscriptions={subscriptions} 
                liquidations={liquidations} 
                commercialPlans={commercialPlans} 
                companies={companies} 
                onRegisterLiquidation={handleRegisterLiquidation} 
            />
        );
      
      case 'payouts_history':
        return <PayoutHistory payouts={payouts} onUpdatePaymentDate={handleUpdatePaymentDate} />;
      
      case 'settings':
        return <SettingsView />;

      default: 
        return <Dashboard subscriptions={subscriptions} partners={partners} goals={goals} />;
    }
  };

  // --- INTERNAL VIEW HELPERS ---

  const PartnersView = () => {
    const [search, setSearch] = useState('');
    const filtered = partners.filter(p => p.Nombre.toLowerCase().includes(search.toLowerCase()));
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Directorio Partners</h2>
                    <p className="text-slate-500 text-sm">Listado completo de agencias y colaboradores.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Nombre / Empresa</th>
                            <th className="px-6 py-4">Nivel</th>
                            <th className="px-6 py-4">Email de Contacto</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">No se encontraron partners.</td></tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.ID_Partner} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{p.Nombre}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            p.Nivel === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                                            p.Nivel === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {p.Nivel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{p.Email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            p.Estado === 'Partner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            <CheckCircle2 size={12} /> {p.Estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedPartner(p)} 
                                            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                            title="Ver detalle"
                                        >
                                            <ArrowRight size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const ClientsView = () => {
    const [filter, setFilter] = useState('Todos');
    
    const displaySubs = subscriptions.map(s => {
        const comp = companies.find(c => c.id === s.id_cliente);
        const partner = partners.find(p => p.ID_Partner === comp?.id_partner);
        return {
            ...s,
            Cliente: comp?.nombre_empresa || 'Empresa Desconocida',
            Partner: partner?.Nombre || 'Sin Partner'
        };
    }).filter(s => filter === 'Todos' || s.Estado === filter);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cartera de Clientes</h2>
                    <p className="text-slate-500 text-sm">Suscripciones activas y canceladas gestionadas por el canal.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    {['Todos', 'Activo', 'Cancelado'].map(st => (
                        <button 
                            key={st}
                            onClick={() => setFilter(st)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === st ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Partner Asignado</th>
                            <th className="px-6 py-4">Cuota (MRR)</th>
                            <th className="px-6 py-4">Fecha Inicio</th>
                            <th className="px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displaySubs.map(s => (
                            <tr key={s.ID_Suscripcion} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-slate-400" />
                                        <span className="font-bold text-slate-700">{s.Cliente}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{s.Partner}</td>
                                <td className="px-6 py-4 font-mono font-medium">{formatCurrency(s.Cuota)}</td>
                                <td className="px-6 py-4 text-slate-500">{s.Fecha_Inicio}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                        s.Estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {s.Estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const SettingsView = () => (
    <div className="max-w-4xl space-y-8 animate-fade-in">
        <header>
            <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>
            <p className="text-slate-500">Administra las fuentes de datos y la personalización de la plataforma.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCw size={18} className="text-indigo-600" /> Fuentes de Datos (Google Sheets)
                </h3>
                <p className="text-sm text-slate-500 mb-4">Introduce las URLs de exportación CSV de tus hojas de cálculo.</p>
                
                {Object.keys(appSettings.sheetsUrls).map(key => (
                    <div key={key}>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{key}</label>
                        <input 
                            type="text" 
                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                            value={(appSettings.sheetsUrls as any)[key]}
                            onChange={e => setAppSettings(prev => ({
                                ...prev,
                                sheetsUrls: { ...prev.sheetsUrls, [key]: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                ))}
                
                <button 
                    onClick={syncData}
                    disabled={isLoading}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Sincronizar Datos Ahora
                </button>
                
                {lastSync && <p className="text-[10px] text-slate-400 text-center mt-2">Última sincronización: {lastSync}</p>}
                {syncError && <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2"><AlertTriangle size={14}/> {syncError}</div>}
            </section>

            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <SettingsIcon size={18} className="text-[#ed8b01]" /> Personalización de Marca
                </h3>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Color de Marca</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={appSettings.brandColor}
                            onChange={e => setAppSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                            className="h-10 w-20 border-0 p-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-sm font-mono text-slate-600">{appSettings.brandColor}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Logo URL (PNG/SVG)</label>
                    <input 
                        type="text" 
                        placeholder="https://tuweb.com/logo.png"
                        value={appSettings.logoUrl || ''}
                        onChange={e => setAppSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Previsualización de Perfil</p>
                            <p className="text-[10px] text-slate-500">Partner Manager Pro v2.5</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onNavigate={v => { 
            setCurrentView(v); 
            setSelectedPartner(null); 
            setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        logoUrl={appSettings.logoUrl} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar for Mobile */}
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500">
                <Filter size={24} />
             </button>
             <h1 className="font-bold text-slate-800">Partner Manager</h1>
             <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 max-w-7xl mx-auto w-full">
            {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
