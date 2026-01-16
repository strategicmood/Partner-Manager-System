
import React, { useMemo } from 'react';
import { Partner, PayableItem } from '../types';
import { formatCurrency } from '../services/logic';
import { X, Check, Printer, User, Building2 } from 'lucide-react';

interface PayoutInvoiceModalProps {
  partner: Partner | undefined;
  items: PayableItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PayoutInvoiceModal: React.FC<PayoutInvoiceModalProps> = ({ partner, items, isOpen, onClose, onConfirm }) => {
  if (!isOpen || !partner) return null;

  const totalAmount = items.reduce((acc, item) => acc + item.Importe, 0);
  const invoiceDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

  // Group items by Client
  const groupedItems = useMemo(() => {
    const groups: Record<string, PayableItem[]> = {};
    items.forEach(item => {
        if (!groups[item.Cliente]) groups[item.Cliente] = [];
        groups[item.Cliente].push(item);
    });
    return groups;
  }, [items]);

  const clientKeys = Object.keys(groupedItems);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h3 className="font-semibold text-slate-800">Vista Previa del Documento de Pago</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>

        {/* INVOICE DOCUMENT AREA (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
            <div className="bg-white shadow-lg mx-auto max-w-2xl p-8 min-h-[600px] text-slate-800" id="invoice-preview">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-indigo-700">Partner Manager Pro</h1>
                        <p className="text-sm text-slate-500 mt-1">Liquidación de Comisiones</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-light text-slate-300">PROPUESTA</div>
                        <div className="text-sm font-mono text-slate-500 mt-2">Referencia: #{invoiceId}</div>
                        <div className="text-sm text-slate-500">{invoiceDate}</div>
                    </div>
                </div>

                {/* Billing Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Provider (Partner) */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Proveedor (Partner)</h4>
                        <div className="font-semibold text-lg text-slate-900">{partner.Nombre}</div>
                        <div className="text-sm text-slate-600 mt-1">{partner.Contacto}</div>
                        <div className="text-sm text-slate-600">{partner.Email}</div>
                        <div className="text-sm text-slate-400 mt-1">ID: {partner.ID_Partner}</div>
                    </div>

                    {/* Bill To (Manujola) */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <Building2 size={12} /> Facturar A:
                         </h4>
                         <div className="font-bold text-slate-800">Manujola S.L.</div>
                         <div className="text-sm text-slate-600 mt-0.5">CIF: B-66957259</div>
                         <div className="text-sm text-slate-600 mt-2">Av. Coll del Portell, 41 Local 1</div>
                         <div className="text-sm text-slate-600">08024 Barcelona</div>
                         <div className="text-sm text-slate-600 mt-2">Tel: 93 285 65 13</div>
                         <div className="text-sm text-indigo-600 font-medium">payment@oct8ne.com</div>
                    </div>
                </div>

                {/* Line Items Grouped by Client */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 uppercase text-xs">
                            <tr>
                                <th className="py-3 text-left pl-4">Concepto / Periodo</th>
                                <th className="py-3 text-left">Detalle</th>
                                <th className="py-3 text-right pr-4">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {clientKeys.map((clientName) => (
                                <React.Fragment key={clientName}>
                                    {/* Client Header Row */}
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="py-2 pl-4 font-bold text-slate-700 border-t border-slate-100 mt-2">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400"/>
                                                Cliente: {clientName}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Items for this Client */}
                                    {groupedItems[clientName].map((item, idx) => (
                                        <tr key={`${clientName}-${idx}`}>
                                            <td className="py-2 pl-8 text-slate-600 font-mono text-xs">
                                                {item.Mes.startsWith('Saldo') ? (
                                                    <span className="font-bold text-slate-800">{item.Mes}</span>
                                                ) : item.Mes}
                                            </td>
                                            <td className="py-2 text-slate-500 text-xs">{item.Regla}</td>
                                            <td className="py-2 pr-4 text-right font-medium">{formatCurrency(item.Importe)}</td>
                                        </tr>
                                    ))}
                                    {/* Subtotal for Client (Optional, good for clarity) */}
                                    <tr>
                                        <td colSpan={2} className="text-right pr-4 py-1 text-[10px] text-slate-400 uppercase tracking-wide">
                                            Subtotal {clientName}
                                        </td>
                                        <td className="text-right pr-4 py-1 text-xs font-semibold text-slate-600 border-b border-slate-100">
                                             {formatCurrency(groupedItems[clientName].reduce((s, i) => s + i.Importe, 0))}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200 font-bold bg-slate-50">
                             <tr>
                                <td colSpan={2} className="py-4 text-right pr-8 uppercase text-xs text-slate-500">Total a Facturar</td>
                                <td className="py-4 text-right pr-4 text-xl text-indigo-700">{formatCurrency(totalAmount)}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Notes */}
                <div className="mt-12 pt-8 border-t border-slate-100 text-xs text-slate-400 text-center">
                    <p>Por favor, emita su factura con los datos fiscales indicados arriba.</p>
                    <p>Envíe la factura a <strong>payment@oct8ne.com</strong> para proceder al pago.</p>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-between items-center">
            <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium">
                <Printer size={16} /> Imprimir / PDF
            </button>
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                    <Check size={18} /> Confirmar Liquidación
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutInvoiceModal;
