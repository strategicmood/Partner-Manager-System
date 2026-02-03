
import { Subscription, Liquidation, PayableItem, Partner, TierRule, CommercialPlan, Company } from '../types';

const calculateWithTier = (fee: number, monthNumber: number, rules: TierRule): { amount: number; ruleName: string } => {
  if (monthNumber <= rules.bountyMonths) {
    const percent = rules.bountyPercentage * 100;
    return { 
        amount: fee * rules.bountyPercentage, 
        ruleName: `Bounty (Mes ${monthNumber} - ${percent}%)` 
    };
  } else if (monthNumber <= 12) {
    const percent = rules.year1Percentage * 100;
    return { 
        amount: fee * rules.year1Percentage, 
        ruleName: `Año 1 (${percent}%)` 
    };
  } else {
    const percent = rules.year2Percentage * 100;
    return { 
        amount: fee * rules.year2Percentage, 
        ruleName: `Año 2+ (${percent}%)` 
    };
  }
};

export const generateAccountStatus = (
  partnerId: string | null, 
  subscriptions: Subscription[],
  liquidations: Liquidation[],
  partners: Partner[],
  commercialPlans: CommercialPlan[],
  companies: Company[]
): PayableItem[] => {
  const targetSubs = partnerId 
    ? subscriptions.filter(sub => {
        const company = companies.find(c => c.id === sub.id_cliente);
        return company?.id_partner === partnerId;
      })
    : subscriptions;

  const today = new Date();
  const currentYear = today.getFullYear();
  const granularItems: PayableItem[] = [];

  targetSubs.forEach(sub => {
    const company = companies.find(c => c.id === sub.id_cliente);
    if (!company) return;

    const partner = partners.find(p => p.ID_Partner === company.id_partner);
    if (!partner) return;

    // Resolve plan by ID or fallback
    const assignedPlan = commercialPlans.find(plan => plan.id === sub.id_incentivo) || commercialPlans[0];
    if (!assignedPlan) return;

    const tier = partner.Nivel || 'Silver';
    const rules = assignedPlan.rules.find(r => r.tier === tier) || assignedPlan.rules[0]; 

    const startDate = new Date(sub.Fecha_Inicio);
    const clientName = company.nombre_empresa;
    const fee = sub.Cuota;

    // Initial Balance
    if (sub.Saldo_Inicial > 0) {
        const legacyPaid = liquidations.some(l => 
            l.ID_Suscripcion === sub.ID_Suscripcion && 
            l.Mes_Pagado === 'SALDO-ANTERIOR'
        );

        if (!legacyPaid) {
            granularItems.push({
                id: `LEGACY-${sub.ID_Suscripcion}`,
                ID_Suscripcion: sub.ID_Suscripcion,
                ID_Partner: partner.ID_Partner,
                Cliente: clientName,
                Mes: 'Saldo Anterior',
                Regla: 'Balance apertura 2025',
                Importe: sub.Saldo_Inicial,
                Estado: 'Pendiente',
                isSelectable: true,
                monthsActive: 999 
            });
        }
    }

    // Monthly Loop
    const monthsActiveTotal = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    const requiredVesting = rules.vestingMonths;
    const inLockupPeriod = monthsActiveTotal < requiredVesting;

    let currentIterDate = new Date(startDate);
    currentIterDate.setDate(1); 
    const endLoopDate = new Date(today.getFullYear(), today.getMonth(), 1);

    while (currentIterDate <= endLoopDate) {
      const year = currentIterDate.getFullYear();
      const month = String(currentIterDate.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      const monthsSinceStart = (currentIterDate.getFullYear() - startDate.getFullYear()) * 12 + (currentIterDate.getMonth() - startDate.getMonth()) + 1;

      const { amount, ruleName } = calculateWithTier(fee, monthsSinceStart, rules);

      const isPaid = liquidations.some(liq => liq.ID_Suscripcion === sub.ID_Suscripcion && liq.Mes_Pagado === monthStr);
      
      let status: PayableItem['Estado'] = 'Pendiente';
      let isSelectable = true;

      if (isPaid) {
        status = 'Pagado';
        isSelectable = false;
      } else if (inLockupPeriod) {
        status = 'Lock-up';
        isSelectable = false;
      }

      granularItems.push({
        id: `${sub.ID_Suscripcion}-${monthStr}`,
        ID_Suscripcion: sub.ID_Suscripcion,
        ID_Partner: partner.ID_Partner,
        Cliente: clientName,
        Mes: monthStr,
        Regla: ruleName,
        Importe: amount,
        Estado: status,
        isSelectable: isSelectable,
        monthsActive: monthsActiveTotal
      });

      currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }
  });

  return granularItems.sort((a, b) => a.Mes.localeCompare(b.Mes));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};
