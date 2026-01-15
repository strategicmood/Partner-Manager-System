
import { Partner, Subscription, Liquidation, PayoutRecord, GoalTarget, CommercialPlan } from './types';

// Commercial Plans (2025 vs Future)
export const MOCK_PLANS: CommercialPlan[] = [
  {
    id: "PLAN-2025",
    name: "Programa Legacy 2025",
    startDate: "2025-01-01",
    isActive: true,
    isDefault: true,
    rules: [
      { 
        tier: 'Silver', 
        minCount: 0,
        maxCount: 9,
        bountyMonths: 1, // 1st month 100%
        bountyPercentage: 1.00, 
        year1Percentage: 0.20, 
        year2Percentage: 0.15,
        vestingMonths: 6
      },
      { 
        tier: 'Gold', 
        minCount: 10,
        maxCount: 20,
        bountyMonths: 2, // 1st & 2nd month 100%
        bountyPercentage: 1.00, 
        year1Percentage: 0.20, 
        year2Percentage: 0.15,
        vestingMonths: 6
      },
      { 
        tier: 'Platinum', 
        minCount: 21,
        maxCount: null, // Infinity
        bountyMonths: 3, // 1st, 2nd & 3rd month 100%
        bountyPercentage: 1.00, 
        year1Percentage: 0.20, 
        year2Percentage: 0.15,
        vestingMonths: 6
      }
    ]
  }
];

export const MOCK_PARTNERS: Partner[] = [
  { ID_Partner: "P01", Nombre: "3Dids", Contacto: "Andrés de España", Email: "finanzas@3dids.com", Estado: "Partner", Nivel: "Platinum", PlanId: "PLAN-2025", Fecha_Alta: "2023-01-15" },
  { ID_Partner: "P02", Nombre: "Onestic", Contacto: "Guillermo García", Email: "admin@onestic.com", Estado: "Partner", Nivel: "Gold", PlanId: "PLAN-2025", Fecha_Alta: "2023-06-20" },
  { ID_Partner: "P03", Nombre: "Alcalink", Contacto: "Luis Alcalá", Email: "hola@alcalink.com", Estado: "Potential Partner", Nivel: "Silver", PlanId: "PLAN-2025", Fecha_Alta: "2022-11-05" },
  { ID_Partner: "P05", Nombre: "Hiberus", Contacto: "Sergio López", Email: "slopez@hiberus.com", Estado: "Partner", Nivel: "Silver", PlanId: "PLAN-2025", Fecha_Alta: "2024-02-10" }, 
  { ID_Partner: "P04", Nombre: "Vex Soluciones", Contacto: "Jose Manuel", Email: "partners@vex.com", Estado: "Potential Partner", Nivel: "Silver", PlanId: "PLAN-2025", Fecha_Alta: new Date().toISOString().split('T')[0] }, 
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { 
    ID_Suscripcion: "C01", 
    ID_Partner: "P01", 
    Cliente: "Hispanitas", 
    Fecha_Inicio: "2024-01-14", 
    Cuota: 118.00, 
    Tipo: "New", 
    Estado: "Activo",
    Meses_Pausados: "2024-07, 2024-08" 
  },
  { ID_Suscripcion: "C02", ID_Partner: "P01", Cliente: "Ecoalf", Fecha_Inicio: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split('T')[0], Fecha_Fin: new Date().toISOString().split('T')[0], Cuota: 200.00, Tipo: "New", Estado: "Cancelado" },
  { 
      ID_Suscripcion: "C03", 
      ID_Partner: "P02", 
      Cliente: "Zara Home", 
      Fecha_Inicio: "2023-06-01", 
      Cuota: 500.00, 
      Tipo: "New", 
      Estado: "Activo",
      Saldo_Inicial: 450.00, 
      Fecha_Calculo_Comision: "2025-01-01" 
  },
  { ID_Suscripcion: "C04", ID_Partner: "P01", Cliente: "Scalpers", Fecha_Inicio: new Date().toISOString().split('T')[0], Cuota: 350.00, Tipo: "New", Estado: "Activo" },
  { ID_Suscripcion: "C05", ID_Partner: "P02", Cliente: "Zara Home (Upgrade)", Fecha_Inicio: new Date().toISOString().split('T')[0], Cuota: 150.00, Tipo: "Upgrade", Estado: "Activo" }, 
];

export const MOCK_LIQUIDATIONS: Liquidation[] = [
  { ID_Liquidacion: "L01", ID_Partner: "P01", Cliente: "Hispanitas", Mes_Pagado: "2024-01", Monto: 118.00, Fecha_Pago: "2024-02-15" },
  { ID_Liquidacion: "L02", ID_Partner: "P01", Cliente: "Hispanitas", Mes_Pagado: "2024-02", Monto: 23.60, Fecha_Pago: "2024-03-15" },
];

export const MOCK_PAYOUTS: PayoutRecord[] = [
    {
        id: "INV-2024-001",
        partnerId: "P01",
        partnerName: "3Dids",
        dateGenerated: "2024-02-15",
        paymentDate: "2024-02-20",
        totalAmount: 118.00,
        status: "Pagado",
        items: [MOCK_LIQUIDATIONS[0]]
    }
];

export const INITIAL_GOALS: GoalTarget[] = [
    { id: "Q1", label: "Q1 2025", newClientsTarget: 10, newPartnersTarget: 3, mrrTarget: 5000 },
    { id: "Q2", label: "Q2 2025", newClientsTarget: 12, newPartnersTarget: 4, mrrTarget: 6000 },
    { id: "Q3", label: "Q3 2025", newClientsTarget: 8, newPartnersTarget: 2, mrrTarget: 4000 }, 
    { id: "Q4", label: "Q4 2025", newClientsTarget: 15, newPartnersTarget: 5, mrrTarget: 8000 }, 
    { id: "Annual", label: "Año 2025", newClientsTarget: 45, newPartnersTarget: 14, mrrTarget: 23000 },
];
