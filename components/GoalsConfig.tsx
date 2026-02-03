
import React, { useState } from 'react';
import { GoalTarget, GoalPeriodId } from '../types';
import { Target, Users, Briefcase, TrendingUp, Edit2, Save, X, Calendar } from 'lucide-react';
import { formatCurrency } from '../services/logic';

interface GoalsConfigProps {
  goals: GoalTarget[];
  onUpdateGoals: (updatedGoals: GoalTarget[]) => void;
}

const GoalsConfig: React.FC<GoalsConfigProps> = ({ goals, onUpdateGoals }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriodId>('Q1');
  const [isEditing, setIsEditing] = useState(false);
  
  // Find current goal object
  const currentGoal = goals.find(g => g.id === selectedPeriod) || goals[0];
  
  // Local state for editing form
  const [editValues, setEditValues] = useState<GoalTarget>(currentGoal);

  const handleEditClick = () => {
    setEditValues({ ...currentGoal });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    const updatedList = goals.map(g => g.id === selectedPeriod ? editValues : g);
    onUpdateGoals(updatedList);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof GoalTarget, value: any) => {
    setEditValues(prev => ({
        ...prev,
        [field]: value
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">🎯 Objetivos y KPIs (2025)</h2>
        <p className="text-slate-500">Define las metas trimestrales y anuales para medir el rendimiento del canal.</p>
      </header>

      {/* Period Selector Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          {goals.map((g) => {
              const isActive = selectedPeriod === g.id;
              return (
                  <button
                    key={g.id}
                    onClick={() => {
                        setSelectedPeriod(g.id);
                        setIsEditing(false);
                    }}
                    className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${isActive 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                    `}
                  >
                      {g.label || g.periodo}
                  </button>
              )
          })}
      </div>

      <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${isEditing ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Objetivos: {currentGoal.label || currentGoal.periodo}
                </h3>
                <p className="text-sm text-slate-500">
                    {isEditing ? 'Editando valores manualmente' : 'Visualizando metas establecidas'}
                </p>
            </div>
            
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <button 
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <X size={16} /> Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-200"
                        >
                            <Save size={16} /> Guardar
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={handleEditClick}
                        className="px-4 py-2 text-sm bg-white border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Editar {currentGoal.id}
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* New Clients Goal */}
            <div className="p-8 text-center relative group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase size={24} />
                </div>
                <h4 className="text-slate-500 font-medium mb-2">Altas de Clientes</h4>
                
                {isEditing ? (
                    <div className="flex justify-center">
                        <input 
                            type="number" 
                            value={editValues.meta_altas}
                            onChange={(e) => handleInputChange('meta_altas', parseInt(e.target.value) || 0)}
                            className="text-3xl font-bold text-slate-800 text-center w-24 border-b-2 border-indigo-300 focus:border-indigo-600 focus:outline-none bg-transparent"
                        />
                    </div>
                ) : (
                    <div className="text-3xl font-bold text-slate-800">{currentGoal.meta_altas}</div>
                )}
                
                <p className="text-xs text-slate-400 mt-2">Target {currentGoal.id === 'Annual' ? 'Anual' : 'Trimestral'}</p>
            </div>

            {/* New Partners Goal */}
            <div className="p-8 text-center relative group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                </div>
                <h4 className="text-slate-500 font-medium mb-2">Nuevos Partners</h4>
                
                {isEditing ? (
                    <div className="flex justify-center">
                         <input 
                            type="number" 
                            value={editValues.meta_partners}
                            onChange={(e) => handleInputChange('meta_partners', parseInt(e.target.value) || 0)}
                            className="text-3xl font-bold text-slate-800 text-center w-24 border-b-2 border-indigo-300 focus:border-indigo-600 focus:outline-none bg-transparent"
                        />
                    </div>
                ) : (
                    <div className="text-3xl font-bold text-slate-800">{currentGoal.meta_partners}</div>
                )}
                
                <p className="text-xs text-slate-400 mt-2">Target {currentGoal.id === 'Annual' ? 'Anual' : 'Trimestral'}</p>
            </div>

            {/* MRR Goal */}
            <div className="p-8 text-center relative group">
                 <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                </div>
                <h4 className="text-slate-500 font-medium mb-2">MRR Nuevo</h4>
                
                 {isEditing ? (
                    <div className="flex justify-center items-center gap-1">
                        <input 
                            type="number" 
                            value={editValues.meta_mrr}
                            onChange={(e) => handleInputChange('meta_mrr', parseFloat(e.target.value) || 0)}
                            className="text-3xl font-bold text-slate-800 text-center w-32 border-b-2 border-indigo-300 focus:border-indigo-600 focus:outline-none bg-transparent"
                        />
                        <span className="text-lg text-slate-400 font-medium">€</span>
                    </div>
                ) : (
                    <div className="text-3xl font-bold text-slate-800">{formatCurrency(currentGoal.meta_mrr)}</div>
                )}
                
                <p className="text-xs text-slate-400 mt-2">Target {currentGoal.id === 'Annual' ? 'Anual' : 'Trimestral'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsConfig;
