import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LiquidationBuilder from './components/LiquidationBuilder';
import Dashboard from './components/Dashboard';
import PayoutHistory from './components/PayoutHistory';
import GoalsConfig from './components/GoalsConfig';
import CommercialConditions from './components/CommercialConditions';
import PartnerDetailView from './components/PartnerDetailView'; // NEW IMPORT
import { MOCK_PARTNERS, MOCK_SUBSCRIPTIONS, MOCK_LIQUIDATIONS, MOCK_PAYOUTS, INITIAL_GOALS, MOCK_PLANS } from './constants';
import { fetchAndParseData } from './services/sheets';
import { formatCurrency } from './services/logic';
import { Menu, Search, ArrowUpCircle, PlusCircle, CheckCircle2, Upload, Database, Palette, Save, RefreshCw, AlertTriangle, Mail, ArrowRight } from 'lucide-react';
import { PayoutRecord, Liquidation, GoalTarget, AppSettings, CommercialPlan, Partner, Subscription } from './types';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // New State for Detailed View
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Data State
  const [liquidations, setLiquidations] = useState(MOCK_LIQUIDATIONS);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(MOCK_PAYOUTS);
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [commercialPlans, setCommercialPlans] = useState<CommercialPlan[]>(MOCK_PLANS);
  const [goals, setGoals] = useState<GoalTarget[]>(INITIAL_GOALS);

  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    logoUrl: null,
    brandColor: '#ed8b01',
    sheetsUrls: {
        partners: 'https://docs.google.com/spreadsheets/d/1VZT_3wKE8igJbo0zeh80JW68OfED3avM-0d3jJ18QJE/edit?gid=112078711#gid=112078711',
        subscriptions: 'https://docs.google.com/spreadsheets/d/1VZT_3wKE8igJbo0zeh80JW68OfED3avM-0d3jJ18QJE/edit?gid=1999849251#gid=1999849251',
        liquidations: 'https://docs.google.com/spreadsheets/d/1VZT_3wKE8igJbo0zeh80JW68OfED3avM-0d3jJ18QJE/edit?gid=0#gid=0',
        plans: 'https://docs.google.com/spreadsheets/d/1VZT_3wKE8igJbo0zeh80JW68OfED3avM-0d3jJ18QJE/edit?gid=585379662#gid=585379662'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // --- DATA SYNC LOGIC ---
  const syncData = async () => {
      setIsLoading(true);
      setSyncError(null);
      
      const results = await fetchAndParseData(appSettings.sheetsUrls);
      
      if (results.error) {
          setSyncError(results.error);
          setIsLoading(false);
          return;
      }

      if (results.partners.length > 0) setPartners(results.partners);
      if (results.subscriptions.length > 0) setSubscriptions(results.subscriptions);
      if (results.liquidations.length > 0) setLiquidations(results.liquidations);
      if (results.plans.length > 0) setCommercialPlans(results.plans);

      setLastSync(new Date().toLocaleTimeString());
      setIsLoading(false);
  };

  useEffect(() => {
      syncData();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleRegisterLiquidation = (newItems: Liquidation[], newPayout: PayoutRecord) => {
    setLiquidations(prev => [...prev, ...newItems]);
    setPayouts(prev => [newPayout, ...prev]);
  };

  const handleUpdatePayoutDate = (payoutId: string, date: string) => {
    setPayouts(prev => prev.map(p => {
        if (p.id === payoutId) {
            return {
                ...p,
                paymentDate: date,
                status: date ? 'Pagado' : 'Pendiente'
            }
        }
        return p;
    }));
  };

  const handleAddPlan = (newPlan: CommercialPlan) => {
    setCommercialPlans(prev => [...prev, newPlan]);
  };

  // --- SETTINGS VIEW HANDLERS ---
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setAppSettings(prev => ({ ...prev, logoUrl: url }));
      }
  };

  const handleUrlChange = (key: keyof AppSettings['sheetsUrls'], value: string) => {
      setAppSettings(prev => ({
          ...prev,
          sheetsUrls: {
              ...prev.sheetsUrls,
              [key]: value
          }
      }));
  };

  // Handle Navigation Change (reset selected partner)
  const handleNavigation = (view: string) => {
      setCurrentView(view);
      setSelectedPartner(null);
  };

  const PartnersView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredPartners = partners.filter(p => 
        p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.Email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">👥 Directorio Partners</h2>
            
            <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Buscar partner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Nombre Partner</th>
                  <th className="px-6 py-4">Volumen (MRR)</th>
                  <th className="px-6 py-4">Nivel</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-center">Liquida?</th>
                  <th className="px-6 py-4 text-center">Estatus</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map(p => {
                    let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                    if (p.Nivel === 'Platinum') badgeColor = "bg-indigo-100 text-indigo-800 border-indigo-300";
                    if (p.Nivel === 'Gold') badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                    if (p.Nivel === 'Silver') badgeColor = "bg-slate-100 text-slate-800 border-slate-300";
                    
                    // Volume Calculation for Table View
                    const mrr = subscriptions
                        .filter(s => s.ID_Partner === p.ID_Partner && s.Estado === 'Activo')
                        .reduce((acc, curr) => acc + curr.Cuota, 0);

                    return (
                        <tr key={p.ID_Partner} className="hover:bg-slate-50 group">
                            <td className="px-6 py-4 font-bold text-slate-900">
                                <button 
                                    onClick={() => setSelectedPartner(p)}
                                    className="hover:text-indigo-600 hover:underline text-left focus:outline-none"
                                >
                                    {p.Nombre}
                                </button>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-700">
                                {formatCurrency(mrr)}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                                    {p.Nivel}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-900 font-medium">{p.Contacto}</div>
                                {p.Email && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Mail size={12} className="text-slate-400" /> {p.Email}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {p.Liquida_com_partner !== false ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        Si
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                        No
                                    </span>
                                )}
                            </td>

                            <td className="px-6 py-4 text-center">
                                {p.Estado === 'Partner' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        🤝 Partner
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        🌱 Potential
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => setSelectedPartner(p)}
                                    className="text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {filteredPartners.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No se encontraron resultados para "{searchTerm}"
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    );
  };

  const ClientsView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredClients = subscriptions.filter(sub => 
        sub.Cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sub.ID_Partner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">💼 Cartera Clientes</h2>
            
            <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4">F. Inicio</th>
                  <th className="px-6 py-4">Cuota</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(sub => {
                     const partnerName = partners.find(p => p.ID_Partner === sub.ID_Partner)?.Nombre || sub.ID_Partner;
                    return (
                        <tr key={sub.ID_Suscripcion} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{sub.Cliente}</td>
                            <td className="px-6 py-4 text-slate-600">{partnerName}</td>
                            <td className="px-6 py-4 text-slate-500">{sub.Fecha_Inicio}</td>
                            <td className="px-6 py-4 font-mono text-slate-700">{formatCurrency(sub.Cuota)}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sub.Tipo === 'New' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                    {sub.Tipo}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {sub.Estado === 'Activo' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        <CheckCircle2 size={12}/> Activo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        Cancelado
                                    </span>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {filteredClients.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            No se encontraron resultados para "{searchTerm}"
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    );
  };

  const SettingsView = () => (
    <div className="space-y-8 animate-fade-in max-w-4xl">
        <header className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">⚙️ Configuración del Sistema</h2>
                <p className="text-slate-500">Personaliza la apariencia y conecta tus fuentes de datos.</p>
            </div>
            
             {/* Sync Controls */}
            <div className="flex flex-col items-end">
                <button 
                    onClick={syncData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Sincronizando...' : 'Sincronizar Datos Ahora'}
                </button>
                {lastSync && <p className="text-xs text-slate-400 mt-2">Última sinc: {lastSync}</p>}
                {syncError && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-center gap-1 max-w-xs">
                        <AlertTriangle size={12} className="flex-shrink-0" /> {syncError}
                    </div>
                )}
            </div>
        </header>

        {/* 1. BRANDING SECTION */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Palette className="text-[#ed8b01]" />
                <h3 className="font-bold text-slate-800 text-lg">Marca y Personalización</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo de la Plataforma</label>
                    <div className="flex items-start gap-4">
                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                            {appSettings.logoUrl ? (
                                <img src={appSettings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center px-2">Sin Logo</span>
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="text-white w-6 h-6" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-3">
                                Sube tu logo para personalizar la barra lateral y los informes. 
                                Recomendado: PNG transparente, min 200x200px.
                            </p>
                            <label className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                Subir Imagen
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Brand Color (Simple Input for now) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Principal</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={appSettings.brandColor}
                            onChange={(e) => setAppSettings(prev => ({...prev, brandColor: e.target.value}))}
                            className="h-10 w-10 p-0 rounded-lg border-0 cursor-pointer shadow-sm"
                        />
                        <input 
                            type="text" 
                            value={appSettings.brandColor}
                            onChange={(e) => setAppSettings(prev => ({...prev, brandColor: e.target.value}))}
                            className="flex-1 border-slate-300 rounded-md shadow-sm focus:ring-[#ed8b01] focus:border-[#ed8b01] sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Este color se utilizará para botones, acentos y gráficos.
                    </p>
                </div>
            </div>
        </section>

        {/* 2. DATA SOURCES SECTION */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Database className="text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-lg">Conexión de Datos (Google Sheets / Unisheet)</h3>
            </div>
            
            <div className="p-6 space-y-6">
                <p className="text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    Ingresa las URLs públicas o de exportación CSV de tus hojas de cálculo para sincronizar los datos en tiempo real.
                </p>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base de Datos de Partners (URL)</label>
                    <input 
                        type="url" 
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        className="w-full bg-white border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-4 py-2 border"
                        value={appSettings.sheetsUrls.partners}
                        onChange={(e) => handleUrlChange('partners', e.target.value)}
                    />
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base de Datos de Suscripciones (URL)</label>
                    <input 
                        type="url" 
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        className="w-full bg-white border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-4 py-2 border"
                        value={appSettings.sheetsUrls.subscriptions}
                        onChange={(e) => handleUrlChange('subscriptions', e.target.value)}
                    />
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Histórico de Liquidaciones (URL)</label>
                    <input 
                        type="url" 
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        className="w-full bg-white border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-4 py-2 border"
                        value={appSettings.sheetsUrls.liquidations}
                        onChange={(e) => handleUrlChange('liquidations', e.target.value)}
                    />
                </div>

                {/* NEW FIELD: PLANS */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Configuración de Planes Comerciales (URL)</label>
                    <input 
                        type="url" 
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        className="w-full bg-white border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-4 py-2 border"
                        value={appSettings.sheetsUrls.plans}
                        onChange={(e) => handleUrlChange('plans', e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">Hoja donde se definen los niveles (Silver, Gold, Platinum) y sus reglas de comisión.</p>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg">
                    <Save size={18} /> Guardar Configuración
                </button>
            </div>
        </section>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard 
            subscriptions={subscriptions} 
            partners={partners}
            goals={goals}
        />;
      case 'goals': return <GoalsConfig goals={goals} onUpdateGoals={setGoals} />;
      case 'partners': 
        if (selectedPartner) {
            return <PartnerDetailView 
                partner={selectedPartner} 
                subscriptions={subscriptions} 
                liquidations={liquidations}
                onBack={() => setSelectedPartner(null)} 
            />;
        }
        return <PartnersView />;
      case 'clients': return <ClientsView />;
      case 'conditions': return <CommercialConditions plans={commercialPlans} onAddPlan={handleAddPlan} />;
      case 'liquidations': return <LiquidationBuilder 
            partners={partners} 
            subscriptions={subscriptions} 
            liquidations={liquidations}
            commercialPlans={commercialPlans}
            onRegisterLiquidation={handleRegisterLiquidation}
        />;
      case 'payouts_history': return <PayoutHistory 
            payouts={payouts}
            onUpdatePaymentDate={handleUpdatePayoutDate}
        />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard 
            subscriptions={subscriptions} 
            partners={partners}
            goals={goals}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigation} 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        logoUrl={appSettings.logoUrl}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu />
            </button>
            <span className="font-bold text-slate-800">Partner Manager</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
}

export default App;