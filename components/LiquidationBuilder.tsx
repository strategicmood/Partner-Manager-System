import React, { useState, useMemo } from 'react';
import { Partner, Subscription, Liquidation, PayableItem, PayoutRecord, CommercialPlan } from '../types';
import { generateAccountStatus, formatCurrency } from '../services/logic';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, AlertCircle, Save, Building2, User, Wallet, PauseCircle, Download } from 'lucide-react';
import PayoutInvoiceModal from './PayoutInvoiceModal';

interface LiquidationBuilderProps {
  partners: Partner[];
  subscriptions: Subscription[];
  liquidations: Liquidation[];
  commercialPlans: CommercialPlan[]; // NEW PROP
  onRegisterLiquidation: (newLiquidations: Liquidation[], newPayout: PayoutRecord) => void;
}

const LiquidationBuilder: React.FC<LiquidationBuilderProps> = ({ 
  partners, 
  subscriptions, 
  liquidations,
  commercialPlans, 
  onRegisterLiquidation 
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // State for nested expansion
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewPartner, setPreviewPartner] = useState<Partner | undefined>(undefined);

  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Generate ALL Payable Items (Waterfall) for ALL partners
  const allPayableItems = useMemo(() => {
    // UPDATED: Now passing commercialPlans so logic can calculate correctly per partner
    return generateAccountStatus(null, subscriptions, liquidations, partners, commercialPlans);
  }, [subscriptions, liquidations, partners, commercialPlans]);

  // 2. Group Data Hierarchically: PartnerID -> ClientName -> Items[]
  const hierarchy = useMemo(() => {
    const struct: Record<string, Record<string, PayableItem[]>> = {};
    
    partners.forEach(p => {
        struct[p.ID_Partner] = {};
    });

    allPayableItems.forEach(item => {
        // Ensure structure exists
        if (!struct[item.ID_Partner]) struct[item.ID_Partner] = {};
        if (!struct[item.ID_Partner][item.Cliente]) struct[item.ID_Partner][item.Cliente] = [];
        
        struct[item.ID_Partner][item.Cliente].push(item);
    });

    return struct;
  }, [allPayableItems, partners]);

  // Toggles
  const togglePartner = (pid: string) => {
    const newSet = new Set(expandedPartners);
    if (newSet.has(pid)) newSet.delete(pid); else newSet.add(pid);
    setExpandedPartners(newSet);
  };

  const toggleClient = (clientKey: string) => {
    const newSet = new Set(expandedClients);
    if (newSet.has(clientKey)) newSet.delete(clientKey); else newSet.add(clientKey);
    setExpandedClients(newSet);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) newSelected.delete(itemId); else newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  // KPIs Global
  const totalPending = allPayableItems.filter(i => i.Estado === 'Pendiente').reduce((acc, c) => acc + c.Importe, 0);
  const totalLocked = allPayableItems.filter(i => i.Estado === 'Lock-up').reduce((acc, c) => acc + c.Importe, 0);
  const totalSelected = allPayableItems.filter(i => selectedItems.has(i.id)).reduce((acc, c) => acc + c.Importe, 0);

  // --- ACTIONS ---

  const handlePreviewClick = () => {
      // Logic restriction: Only allow selecting items from ONE partner for a single invoice in this version
      // or just pick the first partner found in selection to show header.
      const selectedList = allPayableItems.filter(i => selectedItems.has(i.id));
      if (selectedList.length === 0) return;

      const firstPartnerId = selectedList[0].ID_Partner;
      // Check if mixed partners (optional validation)
      const isMixed = selectedList.some(i => i.ID_Partner !== firstPartnerId);
      
      if (isMixed) {
          alert("Por favor, selecciona ítems de un solo partner para generar la liquidación (factura única).");
          return;
      }

      const partnerObj = partners.find(p => p.ID_Partner === firstPartnerId);
      setPreviewPartner(partnerObj);
      setIsModalOpen(true);
  };

  const downloadCSV = (items: Liquidation[]) => {
    // Define CSV Headers matches Google Sheet structure
    const headers = ['ID_Liquidacion', 'ID_Partner', 'Cliente', 'Mes_Pagado', 'Monto', 'Fecha_Pago'];
    
    // Create CSV rows
    const rows = items.map(item => [
        item.ID_Liquidacion,
        item.ID_Partner,
        `"${item.Cliente}"`, // Quote to handle commas in names
        item.Mes_Pagado,
        item.Monto.toFixed(2).replace('.', ','), // Format for Spanish Excel/Sheets (comma decimal)
        item.Fecha_Pago
    ]);

    const csvContent = [
        headers.join(','), 
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nuevas_liquidaciones_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmRegister = () => {
    setIsProcessing(true);
    setIsModalOpen(false); // Close modal immediately, show loading spinner somewhere if needed

    setTimeout(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newLiquidations: Liquidation[] = [];
      const selectedList = allPayableItems.filter(i => selectedItems.has(i.id));
      
      // Create Liquidations (Line Items)
      selectedList.forEach(item => {
          newLiquidations.push({
            ID_Liquidacion: `L-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ID_Partner: item.ID_Partner,
            Cliente: item.Cliente,
            Mes_Pagado: item.Mes,
            Monto: item.Importe,
            Fecha_Pago: todayStr
          });
      });

      // Create Payout Record (Invoice Wrapper)
      if (previewPartner && newLiquidations.length > 0) {
           const newPayout: PayoutRecord = {
               id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
               partnerId: previewPartner.ID_Partner,
               partnerName: previewPartner.Nombre,
               dateGenerated: todayStr,
               totalAmount: totalSelected,
               status: 'Pendiente',
               items: newLiquidations
           };
           
           // Update App State (Update UI)
           onRegisterLiquidation(newLiquidations, newPayout);

           // Trigger CSV Download (Update Google Sheet)
           downloadCSV(newLiquidations);
           
           alert("Liquidación registrada exitosamente.\n\nSe ha descargado el archivo CSV 'nuevas_liquidaciones.csv'.\nPor favor, copia su contenido en tu Google Sheet 'Histórico de Liquidaciones' para guardar los cambios permanentemente.");
      }

      setSelectedItems(new Set()); 
      setIsProcessing(false);
      setPreviewPartner(undefined);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header>
          <h2 className="text-2xl font-bold text-slate-800">Constructor de Liquidaciones</h2>
          <p className="text-slate-500">Vista jerárquica: Partner &gt; Cliente &gt; Mensualidades pendientes</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 font-medium">Disponible Global</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPending)}</div>
          <div className="text-xs text-slate-400 mt-1">Liberado y pendiente</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 font-medium">Retenido Global (Lock-up)</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{formatCurrency(totalLocked)}</div>
          <div className="text-xs text-slate-400 mt-1">Futuro, aún no liberado</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl shadow-lg text-white">
          <div className="text-indigo-100 text-sm font-medium">Seleccionado para Pagar</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totalSelected)}</div>
           <button 
            onClick={handlePreviewClick}
            disabled={selectedItems.size === 0 || isProcessing}
            className="mt-3 w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2"
           >
             {isProcessing ? 'Procesando...' : <><Save className="w-4 h-4" /> Generar Liquidación</>}
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {partners.map(partner => {
            // Calculate Partner Totals
            const partnerClients = hierarchy[partner.ID_Partner] || {};
            const clientNames = Object.keys(partnerClients);
            const partnerItems = Object.values(partnerClients).flat() as PayableItem[];
            
            const pPending = partnerItems.filter(i => i.Estado === 'Pendiente').reduce((acc, c) => acc + c.Importe, 0);
            const pLocked = partnerItems.filter(i => i.Estado === 'Lock-up').reduce((acc, c) => acc + c.Importe, 0);
            
            // Calculate total MRR generated by this partner
            const partnerTotalMRR = subscriptions
                .filter(s => s.ID_Partner === partner.ID_Partner && s.Estado === 'Activo')
                .reduce((sum, s) => sum + s.Cuota, 0);

            const isPExpanded = expandedPartners.has(partner.ID_Partner);

            return (
                <div key={partner.ID_Partner} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* LEVEL 1: PARTNER HEADER */}
                    <button 
                        onClick={() => togglePartner(partner.ID_Partner)}
                        className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 gap-4"
                    >
                        <div className="flex items-center gap-3">
                            {isPExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                            <div className="p-2 bg-white border border-slate-200 rounded-lg">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-800">{partner.Nombre}</h3>
                                <div className="text-xs text-slate-500">{clientNames.length} clientes con actividad</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-right ml-auto md:ml-0">
                             {/* Added MRR Total Column */}
                             <div className="hidden md:block pr-6 border-r border-slate-200">
                                <div className="text-xs text-slate-400 uppercase flex items-center justify-end gap-1">
                                    <Wallet size={10}/> MRR Total
                                </div>
                                <div className="font-bold text-slate-700">{formatCurrency(partnerTotalMRR)}</div>
                             </div>

                             <div>
                                <div className="text-xs text-slate-400 uppercase">Pendiente</div>
                                <div className={`font-semibold ${pPending > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {formatCurrency(pPending)}
                                </div>
                             </div>
                             <div className="hidden sm:block">
                                <div className="text-xs text-slate-400 uppercase">Lock-up</div>
                                <div className="font-semibold text-amber-500">{formatCurrency(pLocked)}</div>
                             </div>
                        </div>
                    </button>

                    {/* LEVEL 2: CLIENT LIST */}
                    {isPExpanded && (
                        <div className="divide-y divide-slate-100 bg-white">
                            {clientNames.length === 0 && (
                                <div className="p-4 text-center text-sm text-slate-400 italic">Sin actividad registrada.</div>
                            )}
                            {clientNames.map(clientName => {
                                const items = partnerClients[clientName];
                                const cPending = items.filter(i => i.Estado === 'Pendiente').reduce((acc, c) => acc + c.Importe, 0);
                                const isCExpanded = expandedClients.has(`${partner.ID_Partner}-${clientName}`);
                                
                                // Find MRR (Cuota) from subscription list to display context
                                const subInfo = subscriptions.find(s => s.Cliente === clientName && s.ID_Partner === partner.ID_Partner);
                                const currentMRR = subInfo?.Cuota || 0;

                                return (
                                    <div key={clientName} className="group">
                                         <button 
                                            onClick={() => toggleClient(`${partner.ID_Partner}-${clientName}`)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors pl-12"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isCExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                <User className="w-4 h-4 text-slate-400" />
                                                <div className="text-left">
                                                    <span className="font-medium text-slate-700">{clientName}</span>
                                                    {/* SHOW MRR HERE */}
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        Cuota: {formatCurrency(currentMRR)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-slate-600">
                                                {cPending > 0 ? (
                                                    <span className="text-emerald-600">{formatCurrency(cPending)} (Pend.)</span>
                                                ) : (
                                                    <span className="text-slate-400">Al día</span>
                                                )}
                                            </div>
                                        </button>

                                        {/* LEVEL 3: MONTHLY TABLE */}
                                        {isCExpanded && (
                                            <div className="bg-slate-50/80 p-4 pl-16 border-t border-slate-100 shadow-inner">
                                                <table className="w-full text-sm">
                                                    <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left w-10">Select</th>
                                                            <th className="px-3 py-2 text-left">Mes</th>
                                                            <th className="px-3 py-2 text-left">Regla</th>
                                                            <th className="px-3 py-2 text-right">Comisión</th>
                                                            <th className="px-3 py-2 text-center">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {items.map(item => (
                                                            <tr key={item.id} className={`${!item.isSelectable ? 'opacity-60 bg-slate-50' : 'bg-white'} ${item.Mes.startsWith('Saldo') ? 'bg-amber-50 font-medium' : ''}`}>
                                                                <td className="px-3 py-2">
                                                                     <input 
                                                                        type="checkbox" 
                                                                        disabled={!item.isSelectable}
                                                                        checked={selectedItems.has(item.id)}
                                                                        onChange={() => toggleItemSelection(item.id)}
                                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2 font-mono text-slate-600">
                                                                    {item.Mes.startsWith('Saldo') ? (
                                                                        <span className="text-amber-700 font-bold">{item.Mes}</span>
                                                                    ) : item.Mes}
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-600 text-xs">{item.Regla}</td>
                                                                <td className="px-3 py-2 text-right font-medium text-slate-700">{formatCurrency(item.Importe)}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {item.Estado === 'Pagado' && <span className="text-xs text-green-600 flex justify-center items-center gap-1"><CheckCircle2 size={12}/> Pagado</span>}
                                                                    {item.Estado === 'Lock-up' && <span className="text-xs text-amber-600 flex justify-center items-center gap-1"><Lock size={12}/> Lock-up</span>}
                                                                    {item.Estado === 'Pendiente' && <span className="text-xs text-blue-600 flex justify-center items-center gap-1"><AlertCircle size={12}/> Pendiente</span>}
                                                                    {item.Estado === 'Pausado' && <span className="text-xs text-slate-500 flex justify-center items-center gap-1"><PauseCircle size={12}/> Pausado</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Confirmation Modal */}
      <PayoutInvoiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRegister}
        partner={previewPartner}
        items={allPayableItems.filter(i => selectedItems.has(i.id))}
      />

    </div>
  );
};

export default LiquidationBuilder;