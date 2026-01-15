import React, { useState, useEffect } from 'react';
import { CommercialPlan, TierRule } from '../types';
import { Award, CheckCircle2, Percent, FolderOpen, Calendar, Plus, Users, Crown, Save, X, Settings2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface CommercialConditionsProps {
  plans: CommercialPlan[];
  onAddPlan: (newPlan: CommercialPlan) => void;
}

const CommercialConditions: React.FC<CommercialConditionsProps> = ({ plans, onAddPlan }) => {
  // Initialize with the first available plan, or empty string
  const [activePlanId, setActivePlanId] = useState<string>(plans[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  
  // -- SYNC FIX: Update active ID when plans data finishes loading from Google Sheets --
  useEffect(() => {
    // If we have plans but the current activePlanId is invalid (or empty/mock), switch to the first real plan
    const currentPlanExists = plans.find(p => p.id === activePlanId);
    if (!currentPlanExists && plans.length > 0) {
        setActivePlanId(plans[0].id);
    }
  }, [plans, activePlanId]);

  // -- NEW PLAN FORM STATE --
  const [newPlanName, setNewPlanName] = useState('Nuevo Plan 2026');
  const [newPlanStart, setNewPlanStart] = useState('2026-01-01');
  // Initialize with a template of 3 tiers
  const [draftRules, setDraftRules] = useState<TierRule[]>([
    { tier: 'Silver', minCount: 0, maxCount: 9, bountyMonths: 1, bountyPercentage: 1.0, year1Percentage: 0.20, year2Percentage: 0.15, vestingMonths: 6 },
    { tier: 'Gold', minCount: 10, maxCount: 20, bountyMonths: 2, bountyPercentage: 1.0, year1Percentage: 0.20, year2Percentage: 0.15, vestingMonths: 6 },
    { tier: 'Platinum', minCount: 21, maxCount: null, bountyMonths: 3, bountyPercentage: 1.0, year1Percentage: 0.20, year2Percentage: 0.15, vestingMonths: 6 }
  ]);

  const activePlan = plans.find(p => p.id === activePlanId);

  const handleCreateClick = () => {
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    // Reset form
    setNewPlanName('Nuevo Plan 2026');
  };

  const handleSavePlan = () => {
      const newPlan: CommercialPlan = {
          id: `PLAN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          name: newPlanName,
          startDate: newPlanStart,
          isActive: true,
          isDefault: false,
          rules: draftRules
      };
      onAddPlan(newPlan);
      setActivePlanId(newPlan.id);
      setIsCreating(false);
  };

  const updateDraftRule = (index: number, field: keyof TierRule, value: any) => {
    const updated = [...draftRules];
    updated[index] = { ...updated[index], [field]: value };
    setDraftRules(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Condiciones Comerciales</h2>
            <p className="text-slate-500">Gestión de planes de comisiones, reglas por nivel y tiempos de permanencia.</p>
        </div>
        {!isCreating && (
            <button 
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
                <Plus size={16} /> Crear Nuevo Plan
            </button>
        )}
      </header>

      {/* --- CREATE PLAN FORM --- */}
      {isCreating ? (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 space-y-8 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Settings2 size={24} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Configurar Nuevo Plan</h3>
                          <p className="text-sm text-slate-500">Define los criterios, porcentajes y periodos de lock-up.</p>
                      </div>
                  </div>
              </div>

              {/* Step 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Plan</label>
                      <input 
                        type="text" 
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={newPlanStart}
                        onChange={(e) => setNewPlanStart(e.target.value)}
                        className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
                      />
                  </div>
              </div>

              {/* Step 2: Tier Configuration */}
              <div className="space-y-6">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Users size={18} className="text-slate-400"/>
                      Configuración por Niveles
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6">
                      {draftRules.map((rule, idx) => (
                          <div key={rule.tier} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                              <div className="flex items-center gap-3 mb-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${rule.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-700' : 
                                      rule.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}
                                  `}>
                                      {rule.tier}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1"></div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                  
                                  {/* COL 1: Requirements (2 Cols) */}
                                  <div className="lg:col-span-2 space-y-3 border-r border-slate-200 pr-4">
                                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                         <Users size={12} /> Requisitos
                                      </p>
                                      <div>
                                          <label className="text-[10px] text-slate-500">Mínimo Clientes</label>
                                          <input 
                                            type="number" 
                                            value={rule.minCount}
                                            onChange={(e) => updateDraftRule(idx, 'minCount', parseInt(e.target.value))}
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm mb-2" 
                                          />
                                          <label className="text-[10px] text-slate-500">Máximo Clientes</label>
                                          <input 
                                            type="number" 
                                            placeholder="∞"
                                            value={rule.maxCount ?? ''}
                                            onChange={(e) => updateDraftRule(idx, 'maxCount', e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm" 
                                          />
                                      </div>
                                  </div>

                                  {/* COL 2: Commission Structure (7 Cols) */}
                                  <div className="lg:col-span-8 space-y-3">
                                      <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                                          <Percent size={12} /> Estructura de Comisión
                                      </p>
                                      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                          
                                          {/* Step 1: Bounty */}
                                          <div className="flex-1 w-full">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</div>
                                                  <span className="text-xs font-medium text-slate-700">Fase Inicial</span>
                                              </div>
                                              <div className="flex gap-2">
                                                 <div className="w-1/2">
                                                    <label className="text-[9px] text-slate-400 uppercase">Meses</label>
                                                    <select 
                                                        value={rule.bountyMonths}
                                                        onChange={(e) => updateDraftRule(idx, 'bountyMonths', parseInt(e.target.value))}
                                                        className="w-full border-slate-300 rounded text-sm py-1 px-1 bg-emerald-50/30"
                                                    >
                                                        {[1,2,3,4,5,6].map(m => <option key={m} value={m}>{m} mes{m>1?'es':''}</option>)}
                                                    </select>
                                                 </div>
                                                 <div className="w-1/2">
                                                    <label className="text-[9px] text-slate-400 uppercase">% Pago</label>
                                                    <input 
                                                        type="number" step="0.05" 
                                                        value={rule.bountyPercentage}
                                                        onChange={(e) => updateDraftRule(idx, 'bountyPercentage', parseFloat(e.target.value))}
                                                        className="w-full border-slate-300 rounded text-sm py-1 px-2 bg-emerald-50/30"
                                                    />
                                                 </div>
                                              </div>
                                          </div>

                                          <ArrowRight className="text-slate-300 w-4 h-4 hidden md:block" />

                                          {/* Step 2: Year 1 Remainder */}
                                          <div className="flex-1 w-full">
                                               <div className="flex items-center gap-2 mb-1">
                                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                                                  <span className="text-xs font-medium text-slate-700">Resto Año 1</span>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] text-slate-400 uppercase">% Comisión Mensual</label>
                                                  <input 
                                                    type="number" step="0.01"
                                                    value={rule.year1Percentage}
                                                    onChange={(e) => updateDraftRule(idx, 'year1Percentage', parseFloat(e.target.value))}
                                                    className="w-full border-slate-300 rounded text-sm py-1 px-2 bg-blue-50/30"
                                                  />
                                              </div>
                                          </div>

                                          <ArrowRight className="text-slate-300 w-4 h-4 hidden md:block" />

                                          {/* Step 3: Year 2+ */}
                                          <div className="flex-1 w-full">
                                               <div className="flex items-center gap-2 mb-1">
                                                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</div>
                                                  <span className="text-xs font-medium text-slate-700">Año 2+ (Vitalicio)</span>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] text-slate-400 uppercase">% Comisión Mensual</label>
                                                  <input 
                                                    type="number" step="0.01"
                                                    value={rule.year2Percentage}
                                                    onChange={(e) => updateDraftRule(idx, 'year2Percentage', parseFloat(e.target.value))}
                                                    className="w-full border-slate-300 rounded text-sm py-1 px-2 bg-indigo-50/30"
                                                  />
                                              </div>
                                          </div>

                                      </div>
                                  </div>

                                  {/* COL 3: Vesting (3 Cols) */}
                                  <div className="lg:col-span-3 space-y-3 border-l border-slate-200 pl-4 bg-amber-50/50 -my-5 py-5 rounded-r-xl">
                                       <p className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1">
                                          <ShieldCheck size={12} /> Permanencia
                                      </p>
                                      <div>
                                          <label className="text-[10px] text-slate-500 block mb-1">Periodo Lock-up (Meses)</label>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                type="number" 
                                                value={rule.vestingMonths}
                                                onChange={(e) => updateDraftRule(idx, 'vestingMonths', parseInt(e.target.value))}
                                                className="w-full border border-amber-300 text-amber-800 font-bold text-center rounded px-2 py-2 text-sm bg-white" 
                                              />
                                              <Clock size={16} className="text-amber-400" />
                                          </div>
                                          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                                              La comisión se genera pero queda retenida hasta cumplir {rule.vestingMonths} meses.
                                          </p>
                                      </div>
                                  </div>

                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleCancelCreate}
                    className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                      <X size={16} /> Cancelar
                  </button>
                  <button 
                    onClick={handleSavePlan}
                    className="px-6 py-2 text-sm text-white bg-indigo-600 font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                      <Save size={16} /> Guardar Plan
                  </button>
              </div>
          </div>
      ) : (
        <>
            {/* --- VIEW MODE: PLANS TABS --- */}
            {plans.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Cargando planes comerciales...</p>
                </div>
            ) : (
                <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
                    {plans.map(plan => (
                        <button
                            key={plan.id}
                            onClick={() => setActivePlanId(plan.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap min-w-[200px]
                                ${activePlanId === plan.id 
                                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-50 shadow-md' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            <div className={`p-2 rounded-lg ${activePlanId === plan.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                <FolderOpen size={20} />
                            </div>
                            <div className="text-left">
                                <div className={`font-bold text-sm ${activePlanId === plan.id ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {plan.name}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} /> {plan.startDate}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* --- VIEW MODE: PLAN DETAILS --- */}
            {activePlan && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">Info:</span>
                        Este plan está {activePlan.isActive ? 'Activo' : 'Inactivo'} y {activePlan.isDefault ? 'es el plan por defecto para nuevos partners.' : 'se aplica solo bajo asignación manual.'}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {activePlan.rules.map((rule) => {
                        // Visual styles based on Tier
                        let bgGradient = "bg-white";
                        let borderColor = "border-slate-200";
                        let iconColor = "text-slate-500";
                        let TierIcon = Award;
                        
                        if (rule.tier === 'Platinum') {
                            bgGradient = "bg-gradient-to-br from-indigo-50 to-indigo-100/50";
                            borderColor = "border-indigo-200";
                            iconColor = "text-indigo-600";
                            TierIcon = Crown;
                        } else if (rule.tier === 'Gold') {
                            bgGradient = "bg-gradient-to-br from-amber-50 to-amber-100/50";
                            borderColor = "border-amber-200";
                            iconColor = "text-amber-500";
                            TierIcon = Award;
                        } else {
                            bgGradient = "bg-gradient-to-br from-slate-50 to-slate-100/50";
                            borderColor = "border-slate-300";
                            iconColor = "text-slate-400";
                            TierIcon = Award;
                        }

                        // Determine client range text
                        const clientRangeText = rule.maxCount 
                            ? `${rule.minCount} - ${rule.maxCount} clientes`
                            : `> ${rule.minCount} clientes`;

                        // Default to 6 if undefined (legacy support)
                        const vestingDisplay = rule.vestingMonths ?? 6;

                        return (
                            <div key={rule.tier} className={`rounded-xl shadow-sm border ${borderColor} ${bgGradient} overflow-hidden relative transition-all hover:shadow-md flex flex-col h-full`}>
                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-3 rounded-full bg-white shadow-sm ${iconColor}`}>
                                            <TierIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold ${iconColor === 'text-slate-400' ? 'text-slate-700' : iconColor}`}>
                                                {rule.tier}
                                            </h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                <Users size={12}/>
                                                {clientRangeText}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 bg-white/60 p-4 rounded-lg border border-white/50 mt-4">
                                        {/* Variable Bounty */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                                <span>Bounty ({rule.bountyMonths} {rule.bountyMonths === 1 ? 'mes' : 'meses'})</span>
                                            </div>
                                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 text-sm">
                                                {(rule.bountyPercentage * 100).toFixed(0)}%
                                            </span>
                                        </div>

                                        {/* Year 1 */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                                <Percent size={16} className="text-blue-500" />
                                                <span>Recurrente (Año 1)</span>
                                            </div>
                                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 text-sm">
                                                {(rule.year1Percentage * 100).toFixed(0)}%
                                            </span>
                                        </div>

                                        {/* Year 2+ */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                                <Percent size={16} className="text-indigo-500" />
                                                <span>Vitalicio (Año 2+)</span>
                                            </div>
                                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 text-sm">
                                                {(rule.year2Percentage * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-50/50 p-3 border-t border-amber-100 flex items-center justify-center gap-2 text-xs text-amber-700 font-medium">
                                    <ShieldCheck size={14} />
                                    Lock-up: {vestingDisplay} meses
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default CommercialConditions;