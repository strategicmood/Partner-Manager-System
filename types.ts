
export type PartnerTier = 'Platinum' | 'Gold' | 'Silver';

export interface Partner {
  ID_Partner: string;
  Nombre: string;
  Contacto: string; // Contact Person
  Email: string;
  Estado: 'Partner' | 'Potential Partner'; 
  Nivel: PartnerTier; 
  PlanId: string; // Links partner to a specific Commercial Plan
  Fecha_Alta: string; // YYYY-MM-DD
  
  // Optional flag for logic/parsing safety
  Liquida_com_partner?: boolean;
}

export interface Subscription {
  ID_Suscripcion: string;
  ID_Partner: string;
  Cliente: string;
  Fecha_Inicio: string; // YYYY-MM-DD
  Fecha_Fin?: string; // YYYY-MM-DD
  Cuota: number;
  Tipo: 'New' | 'Upgrade'; // Plan Type
  Estado: 'Activo' | 'Cancelado';
  
  // New fields for Data Migration / Opening Balance
  Saldo_Inicial?: number; // Deuda acumulada anterior
  Fecha_Calculo_Comision?: string; // YYYY-MM-DD (Override start date for calculations)
  
  // Handling temporary pauses
  Meses_Pausados?: string; // Comma separated list of YYYY-MM (e.g., "2024-08, 2024-09")
}

export interface Liquidation {
  ID_Liquidacion: string;
  ID_Partner: string;
  Cliente: string;
  Mes_Pagado: string; // YYYY-MM
  Monto: number;
  Fecha_Pago: string;
}

export interface PayableItem {
  id: string; 
  ID_Suscripcion: string;
  ID_Partner: string;
  Cliente: string;
  Mes: string; // YYYY-MM or Label
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

export type GoalPeriodId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';

export interface GoalTarget {
  id: GoalPeriodId;
  label: string;
  newClientsTarget: number;
  newPartnersTarget: number;
  mrrTarget: number;
}

export interface AppSettings {
  logoUrl: string | null;
  brandColor: string;
  sheetsUrls: {
    partners: string;
    subscriptions: string;
    liquidations: string;
    plans: string; // New field for Commercial Plans Sheet
  };
}

// Configuration for Commercial Rules
export interface TierRule {
  tier: PartnerTier;
  // Client Ranges
  minCount: number;
  maxCount: number | null; // null means Infinity
  
  // Commission Structure
  bountyMonths: number; // How many months get 100% (1, 2, or 3)
  bountyPercentage: number; // Usually 1.0 (100%)
  year1Percentage: number; // Usually 0.20 (20%)
  year2Percentage: number; // Usually 0.15 (15%)
  
  // Vesting / Lock-up
  vestingMonths: number; // Minimum months client must be active to release commission (e.g. 6)
}

// Commercial Plan Container
export interface CommercialPlan {
  id: string;
  name: string;
  startDate: string;
  isActive: boolean;
  isDefault: boolean;
  rules: TierRule[];
}