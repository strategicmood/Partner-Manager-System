
import React, { useState } from 'react';
import { Partner, Subscription, Liquidation } from '../types';
import { formatCurrency } from '../services/logic';
import { ArrowLeft, Wallet, Users, CheckCircle2, XCircle, Clock, Building2, Mail, Calendar, ExternalLink } from 'lucide-react';

interface PartnerDetailViewProps {
  partner: Partner;
  subscriptions: Subscription[];
  liquidations: Liquidation[];
  onBack: () => void;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partner, subscriptions, liquidations, onBack }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'payouts'>('clients');

  // --- METRICS CALCULATION ---
  const partnerSubs = subscriptions.filter(s => s.ID_Partner === partner.ID_Partner);
  const activeSubs = partnerSubs.filter(s => s.Estado === 'Activo');
  const cancelledSubs = partnerSubs.filter(s => s.Estado === 'Cancelado');
  
  const totalMRR = activeSubs.reduce((acc, s) => acc + s.Cuota, 0);
  
  const partnerLiqs = liquidations.filter(l => l.ID_Partner === partner.ID_Partner);
  const totalPaid = partnerLiqs.reduce((acc, l) => acc + l.Monto, 0);

  // Calculate Last Payout Date
  const lastPayout = partnerLiqs.length > 0 
    ? partnerLiqs.sort((a, b) => new Date(b.Fecha_Pago).getTime() - new Date(a.Fecha_Pago).getTime())[0].Fecha_Pago
    : 'N/A';

  // Badge Logic
  let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
  if (partner.Nivel === 'Platinum') badgeColor = "bg-indigo-100 text-indigo-800 border-indigo-300";
  if (partner.Nivel === 'Gold') badgeColor = "bg-amber-100 text-amber-800 border-amber-300";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* HEADER / NAVIGATION */}
      <div className="flex items-center gap-4">
        <button 
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
        >
            <ArrowLeft size={20} />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {partner.Nombre}
                <span className={`text-sm px-3 py-0.5 rounded-full border ${badgeColor}`}>
                    {partner.Nivel}
                </span>
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Building2 size={14}/> ID: {partner.ID_Partner}</span>
                <span className="flex items-center gap-1"><Calendar size={14}/> Alta: {partner.Fecha_Alta}</span>
                <span className="flex items-center gap-1"><Mail size={14}/> {partner.Email}</span>
            </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* MRR Managed */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-slate-500">Volumen Gestionado (MRR)</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalMRR)}</h3>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Wallet size={20}/></div>
              </div>
          </div>

          {/* Active Clients */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-slate-500">Clientes Activos</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeSubs.length}</h3>
                      <p className="text-xs text-slate-400 mt-1">Total traídos: {partnerSubs.length}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Users size={20}/></div>
              </div>
          </div>

          {/* Total Commission Paid */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-slate-500">Comisiones Pagadas</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPaid)}</h3>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><CheckCircle2 size={20}/></div>
              </div>
          </div>

          {/* Status Info */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-slate-500">Estado de Cuenta</p>
                      <div className="mt-1 flex items-center gap-2">
                        {partner.Liquida_com_partner !== false ? (
                             <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700">
                                Liquidable
                             </span>
                        ) : (
                             <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-700">
                                Pagos Detenidos
                             </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Último pago: {lastPayout}</p>
                  </div>
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg"><Clock size={20}/></div>
              </div>
          </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <div className="border-b border-slate-200 flex">
              <button 
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'clients' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Cartera de Clientes ({partnerSubs.length})
              </button>
              <button 
                onClick={() => setActiveTab('payouts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payouts' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Historial de Pagos
              </button>
          </div>

          <div className="p-0">
              {activeTab === 'clients' && (
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-3">Cliente</th>
                              <th className="px-6 py-3">Fecha Inicio</th>
                              <th className="px-6 py-3">Plan / Tipo</th>
                              <th className="px-6 py-3">Cuota (MRR)</th>
                              <th className="px-6 py-3">Estado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {partnerSubs.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay clientes asociados.</td></tr>
                          ) : (
                              partnerSubs.map(sub => (
                                  <tr key={sub.ID_Suscripcion} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{sub.Cliente}</td>
                                      <td className="px-6 py-4 text-slate-500">{sub.Fecha_Inicio}</td>
                                      <td className="px-6 py-4 text-slate-600">{sub.Tipo}</td>
                                      <td className="px-6 py-4 font-mono">{formatCurrency(sub.Cuota)}</td>
                                      <td className="px-6 py-4">
                                          {sub.Estado === 'Activo' ? (
                                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                                  <CheckCircle2 size={12}/> Activo
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                                  <XCircle size={12}/> Cancelado
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              )}

              {activeTab === 'payouts' && (
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-3">ID Liquidación</th>
                              <th className="px-6 py-3">Fecha Pago</th>
                              <th className="px-6 py-3">Cliente Origen</th>
                              <th className="px-6 py-3">Periodo (Mes)</th>
                              <th className="px-6 py-3 text-right">Importe</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {partnerLiqs.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay pagos registrados.</td></tr>
                          ) : (
                              partnerLiqs.map(liq => (
                                  <tr key={liq.ID_Liquidacion} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-mono text-slate-500">{liq.ID_Liquidacion}</td>
                                      <td className="px-6 py-4 text-slate-700 font-medium">{liq.Fecha_Pago}</td>
                                      <td className="px-6 py-4 text-slate-600">{liq.Cliente}</td>
                                      <td className="px-6 py-4 text-slate-600">{liq.Mes_Pagado}</td>
                                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{formatCurrency(liq.Monto)}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              )}
          </div>
      </div>

    </div>
  );
};

export default PartnerDetailView;
