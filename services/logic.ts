
import { Subscription, Liquidation, PayableItem, Partner, TierRule, CommercialPlan } from '../types';

// Helper to calculate based on specific Tier Rules
const calculateWithTier = (fee: number, monthNumber: number, rules: TierRule): { amount: number; ruleName: string } => {
  // 1. Bounty Logic (Variable duration: 1, 2, or 3 months)
  if (monthNumber <= rules.bountyMonths) {
    const percent = rules.bountyPercentage * 100;
    return { 
        amount: fee * rules.bountyPercentage, 
        ruleName: `Bounty (Mes ${monthNumber} - ${percent}%)` 
    };
  } 
  // 2. Year 1 Logic (Remainder of first 12 months)
  else if (monthNumber <= 12) {
    const percent = rules.year1Percentage * 100;
    return { 
        amount: fee * rules.year1Percentage, 
        ruleName: `Año 1 (${percent}%)` 
    };
  } 
  // 3. Year 2+ Logic
  else {
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
  commercialPlans: CommercialPlan[] 
): PayableItem[] => {
  const targetSubs = partnerId 
    ? subscriptions.filter(sub => sub.ID_Partner === partnerId)
    : subscriptions;

  const today = new Date();
  const currentYear = today.getFullYear();
  const granularItems: PayableItem[] = [];

  targetSubs.forEach(sub => {
    // A. Find Partner Logic (Tier & Plan)
    const partner = partners.find(p => p.ID_Partner === sub.ID_Partner);
    
    // Find the Plan assigned to this partner, or fallback to first one/default
    const assignedPlan = commercialPlans.find(plan => plan.id === partner?.PlanId) || commercialPlans[0];
    
    const tier = partner?.Nivel || 'Silver'; // Default to Silver if not found
    
    // Find specific rules for this Tier within the Plan
    const rules = assignedPlan.rules.find(r => r.tier === tier) || assignedPlan.rules[0]; 

    const startDate = new Date(sub.Fecha_Inicio);
    const calculationStartDate = sub.Fecha_Calculo_Comision 
        ? new Date(sub.Fecha_Calculo_Comision) 
        : startDate;

    const clientName = sub.Cliente;
    const fee = sub.Cuota;

    // Parse Paused Months safely
    const pausedMonthsSet = new Set<string>();
    if (sub.Meses_Pausados) {
        sub.Meses_Pausados.split(',').forEach(m => {
            pausedMonthsSet.add(m.trim());
        });
    }

    // B. Handle "Saldo Inicial" (Legacy Debt)
    if (sub.Saldo_Inicial && sub.Saldo_Inicial > 0) {
        const legacyPaid = liquidations.some(l => 
            l.ID_Partner === sub.ID_Partner && 
            l.Cliente === clientName && 
            l.Mes_Pagado === 'SALDO-INICIAL'
        );

        if (!legacyPaid) {
            granularItems.push({
                id: `LEGACY-${sub.ID_Suscripcion}`,
                ID_Suscripcion: sub.ID_Suscripcion,
                ID_Partner: sub.ID_Partner,
                Cliente: clientName,
                Mes: 'Saldo Anterior', // Special Label
                Regla: 'Deuda acumulada (Migración)',
                Importe: sub.Saldo_Inicial,
                Estado: 'Pendiente',
                isSelectable: true,
                monthsActive: 999 
            });
        }
    }

    // C. Calculate total months active until today
    const monthsActiveTotal =
      (today.getFullYear() - startDate.getFullYear()) * 12 +
      (today.getMonth() - startDate.getMonth());

    // Lock-up logic: Check against the CONFIGURABLE vesting months from rules
    // Default to 6 if undefined in legacy plans
    const requiredVesting = rules.vestingMonths ?? 6;
    const inLockupPeriod = monthsActiveTotal < requiredVesting;

    // D. Monthly Generation Loop
    let currentIterDate = new Date(calculationStartDate);
    // Normalize to first of month
    currentIterDate.setDate(1); 
    
    const endLoopDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const getMonthIndex = (d: Date) => {
        return (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth()) + 1;
    };

    while (currentIterDate <= endLoopDate) {
      const year = currentIterDate.getFullYear();
      const month = String(currentIterDate.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      const currentMonthIdx = getMonthIndex(currentIterDate);

      // 1. Calculate Amount using TIER RULES from the SPECIFIC PLAN
      const { amount, ruleName } = calculateWithTier(fee, currentMonthIdx, rules);

      // 2. Check logic states
      const isPaid = liquidations.some(
        liq =>
          liq.ID_Partner === sub.ID_Partner &&
          liq.Cliente === clientName &&
          liq.Mes_Pagado === monthStr
      );

      const isPaused = pausedMonthsSet.has(monthStr);

      // 3. Determine Status
      let status: PayableItem['Estado'] = 'Pendiente';
      let isSelectable = true;

      if (isPaid) {
        status = 'Pagado';
        isSelectable = false;
      } else if (isPaused) {
        status = 'Pausado';
        isSelectable = false; 
      } else if (inLockupPeriod) {
        status = 'Lock-up';
        isSelectable = false;
      }

      granularItems.push({
        id: `${sub.ID_Suscripcion}-${monthStr}`,
        ID_Suscripcion: sub.ID_Suscripcion,
        ID_Partner: sub.ID_Partner,
        Cliente: clientName,
        Mes: monthStr,
        Regla: ruleName,
        Importe: amount,
        Estado: status,
        isSelectable: isSelectable,
        monthsActive: monthsActiveTotal
      });

      // Advance month
      currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }
  });

  // 2. Post-Process: Group previous years' PENDING items into "Saldo Anterior"
  const finalItems: PayableItem[] = [];
  const pendingLegacyGroup: Record<string, { amount: number; items: PayableItem[] }> = {};

  granularItems.forEach(item => {
    if (item.id.startsWith('LEGACY')) {
        finalItems.push(item);
        return;
    }

    const itemYear = parseInt(item.Mes.split('-')[0]);

    // Group only if previous year AND Pending (not paused)
    // We aggregate ALL previous years into a single key per client
    if (itemYear < currentYear && item.Estado === 'Pendiente') {
      const key = `${item.ID_Partner}-${item.Cliente}-PREVIOUS`;
      if (!pendingLegacyGroup[key]) {
        pendingLegacyGroup[key] = { amount: 0, items: [] };
      }
      pendingLegacyGroup[key].amount += item.Importe;
      pendingLegacyGroup[key].items.push(item);
    } else {
      finalItems.push(item);
    }
  });

  // Create aggregated items for previous years
  Object.values(pendingLegacyGroup).forEach(group => {
    if (group.items.length > 0) {
      const firstItem = group.items[0];
      finalItems.push({
        ...firstItem,
        id: `SALDO-ANTERIOR-${firstItem.ID_Suscripcion}`,
        Mes: `Saldo Anterior`,
        Regla: `Acumulado hasta cierre ${currentYear - 1}`,
        Importe: group.amount,
        Estado: 'Pendiente',
        isSelectable: true
      });
    }
  });

  // 3. Sort
  return finalItems.sort((a, b) => {
    const getSortKey = (item: PayableItem) => {
      if (item.id.startsWith('LEGACY')) return '0000-00'; 
      if (item.Mes.startsWith('Saldo')) return '0000-01'; // Place Saldo Anterior at the top
      return item.Mes;
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};
