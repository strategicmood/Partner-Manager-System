import React, { useState } from 'react';
import { LayoutDashboard, Users, Briefcase, BadgeEuro, Settings, ChevronLeft, ChevronRight, FileText, Target, Scale } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  logoUrl: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, toggleSidebar, logoUrl }) => {
  // Default to true (Collapsed/Rail) as requested for initial view
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Main navigation items
  const menuItems = [
    { id: 'dashboard', label: 'Arena (Dashboard)', icon: LayoutDashboard },
    { id: 'goals', label: 'Objetivos / KPIs', icon: Target },
    { id: 'partners', label: 'Directorio Partners', icon: Users },
    { id: 'clients', label: 'Cartera Clientes', icon: Briefcase },
    { id: 'conditions', label: 'Condiciones Comerciales', icon: Scale }, // NEW ITEM
    { id: 'liquidations', label: 'Liquidaciones', icon: BadgeEuro },
    { id: 'payouts_history', label: 'Admin Pagos', icon: FileText },
  ];

  const renderButton = (id: string, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => {
        onNavigate(id);
        // Close on mobile when clicked
        if (window.innerWidth < 768) toggleSidebar();
      }}
      className={`
        group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 mx-2
        ${currentView === id 
          ? 'bg-[#ed8b01] text-white shadow-md' // Active State Orange
          : 'text-slate-400 hover:bg-[#2c373e] hover:text-white'} 
        ${isCollapsed ? 'md:justify-center' : ''}
      `}
      title={isCollapsed ? label : ''}
    >
      <Icon className={`${isCollapsed ? 'md:w-6 md:h-6' : 'w-5 h-5'} w-5 h-5 flex-shrink-0 transition-all duration-300`} />
      
      {/* Text: Hidden on Desktop if collapsed, Always visible on Mobile */}
      <span 
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'
        } w-auto opacity-100`}
      >
        {label}
      </span>
      
      {/* Tooltip for collapsed mode (hover only, desktop only) */}
      {isCollapsed && (
        <div className="hidden md:block absolute left-16 bg-[#334048] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg border border-slate-600">
          {label}
        </div>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container - Updated BG Color */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        bg-[#334048] text-white transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64 shadow-xl border-r border-[#2a353c]
      `}>
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b border-[#2a353c] flex-shrink-0 relative overflow-hidden">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'md:justify-center md:px-0' : 'px-6 w-full'} px-6 w-full`}>
            
            {/* Logo Logic */}
            {logoUrl ? (
                <div className="flex-shrink-0">
                    <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'}`} 
                    />
                </div>
            ) : (
                <div className="bg-gradient-to-br from-[#ed8b01] to-orange-600 p-2.5 rounded-xl shadow-lg flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
            )}
            
            {/* Title: Hidden on Desktop if collapsed, Always visible on Mobile */}
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'} w-auto opacity-100`}>
              <h1 className="font-bold text-lg leading-none tracking-tight">Partner<br/><span className="text-[#ed8b01]">Manager</span></h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              {renderButton(item.id, item.label, item.icon)}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer / Settings / Toggle */}
        <div className="p-3 border-t border-[#2a353c] space-y-3 flex-shrink-0 flex flex-col bg-[#334048]">
          {renderButton('settings', 'Configuración', Settings)}
          
          <div className="hidden md:flex justify-center pt-2 pb-2">
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="
                    w-8 h-8 flex items-center justify-center rounded-full 
                    bg-[#2c373e] hover:bg-[#ed8b01] text-slate-400 hover:text-white 
                    transition-all duration-200 border border-[#2a353c] hover:border-[#ed8b01]
                    shadow-sm
                "
                title={isCollapsed ? "Expandir" : "Contraer"}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;