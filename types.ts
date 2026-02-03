
export type PartnerTier = 'Platinum' | 'Gold' | 'Silver';

// Added GoalPeriodId type
export type GoalPeriodId = string;

export interface Partner {
  ID_Partner: string;
  Nombre: string;
  Contacto: string;
  Email: string;
  Estado: 'Partner' | 'Potential Partner';
  Nivel: PartnerTier;
  Fecha_Alta: string;
  Liquida_com_partner: boolean;
  PlanId?: string; // Optional link to a specific incentive plan
}

export interface Company {
  id: string;
  nombre_empresa: string;
  dominio: string;
  id_partner: string;
  estado_global: string;
  fecha_conversion: string;
}

export interface Subscription {
  ID_Suscripcion: string;
  id_cliente: string; // FK to Company
  id_incentivo: string; // FK to Plan
  Cuota: number;
  Tipo: 'Alta' | 'Upgrade' | 'New' | string;
  Estado: 'Activa' | 'Cancelada' | 'Activo' | 'Cancelado';
  Fecha_Inicio: string;
  Fecha_Fin: string | null;
  Saldo_Inicial: number;
  // Optional for logic calculation
  Meses_Pausados?: string;
  Fecha_Calculo_Comision?: string;
}

export interface Liquidation {
  ID_Liquidacion: string;
  ID_Partner: string;
  ID_Suscripcion: string;
  Mes_Pagado: string;
  Monto: number;
  Fecha_Pago: string;
  // Added optional Cliente field for compatibility with UI/Mocks
  Cliente?: string;
}

export interface PayableItem {
  id: string;
  ID_Suscripcion: string;
  ID_Partner: string;
  Cliente: string; // Resolved from Company
  Mes: string;
  Regla: string;
  Importe: number;
  Estado: 'Pendiente' | 'Pagado' | 'Lock-up' | 'Pausado';
  isSelectable: boolean;
  monthsActive: number;
}

export interface PayoutRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  dateGenerated: string;
  paymentDate?: string;
  totalAmount: number;
  status: 'Pendiente' | 'Pagado';
  items: Liquidation[];
}

export interface GoalTarget {
  id: string;
  periodo: string;
  meta_altas: number;
  meta_partners: number; // Added meta_partners
  meta_mrr: number;
  fecha_inicio: string;
  fecha_fin: string;
  // Added optional label field for compatibility with Mocks
  label?: string;
}

export interface TierRule {
  tier: PartnerTier;
  minCount: number;
  maxCount: number | null;
  bountyMonths: number;
  bountyPercentage: number;
  year1Percentage: number;
  year2Percentage: number;
  vestingMonths: number;
}

export interface CommercialPlan {
  id: string;
  nombre_programa: string;
  anio_vigencia: number;
  isActive: boolean;
  rules: TierRule[];
  // Added optional fields for UI compatibility
  name?: string;
  startDate?: string;
  isDefault?: boolean;
}

export interface AppSettings {
  logoUrl: string | null;
  brandColor: string;
  sheetsUrls: {
    partners: string;
    subscriptions: string;
    liquidations: string;
    plans: string;
    companies: string;
    goals: string;
  };
}
