
import { Partner, Subscription, Liquidation, CommercialPlan, TierRule, Company, GoalTarget, AppSettings } from '../types';

const getExportUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gidMatchHash = url.match(/#gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : (gidMatchHash ? gidMatchHash[1] : '0');

    if (match) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
    }
    return null;
  } catch (e) { 
    return null; 
  }
};

const parsePercentage = (val: string): number => {
    if (!val) return 0;
    let cleaned = val.replace(',', '.').replace('%', '').trim();
    let n = parseFloat(cleaned);
    if (isNaN(n)) return 0;
    if (val.includes('%')) return n / 100;
    if (n > 1) return n / 100;
    return n;
};

const parseCSV = (text: string, columnMapper: (header: string) => string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const headers = rawHeaders.map(h => columnMapper(h));
    
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else current += char;
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        const obj: any = {};
        headers.forEach((h, i) => {
            if (values[i] !== undefined) obj[h] = values[i];
        });
        return obj;
    });
};

const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9_]/g, '');

const mapPartnerHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id' || n === 'id_partner') return 'ID_Partner';
    if (n.includes('nombre')) return 'Nombre';
    if (n.includes('contacto')) return 'Contacto';
    if (n.includes('email')) return 'Email';
    if (n.includes('estado')) return 'Estado';
    if (n.includes('alta')) return 'Fecha_Alta';
    if (n.includes('liquida')) return 'Liquida_com_partner';
    if (n.includes('nivel')) return 'Nivel';
    return h;
};

const mapCompanyHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id') return 'id';
    if (n.includes('nombre_empresa')) return 'nombre_empresa';
    if (n.includes('dominio')) return 'dominio';
    if (n.includes('id_partner')) return 'id_partner';
    if (n.includes('estado')) return 'estado_global';
    if (n.includes('conversion')) return 'fecha_conversion';
    return h;
};

const mapSubscriptionHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id') return 'ID_Suscripcion';
    if (n.includes('id_cliente')) return 'id_cliente';
    if (n.includes('id_incentivo')) return 'id_incentivo';
    if (n.includes('cuota')) return 'Cuota';
    if (n.includes('tipo')) return 'Tipo';
    if (n.includes('estado')) return 'Estado';
    if (n.includes('inicio')) return 'Fecha_Inicio';
    if (n.includes('fin')) return 'Fecha_Fin';
    if (n.includes('saldo')) return 'Saldo_Inicial';
    return h;
};

const mapLiquidationHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id') return 'ID_Liquidacion';
    if (n.includes('id_partner')) return 'ID_Partner';
    if (n.includes('id_suscripcion')) return 'ID_Suscripcion';
    if (n.includes('mes')) return 'Mes_Pagado';
    if (n.includes('monto')) return 'Monto';
    if (n.includes('pago')) return 'Fecha_Pago';
    return h;
};

const mapPlanHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id') return 'id';
    if (n.includes('programa')) return 'nombre_programa';
    if (n.includes('nivel')) return 'nivel';
    if (n.includes('min_clientes')) return 'minCount';
    if (n.includes('max_clientes')) return 'maxCount';
    if (n.includes('pct_bounty')) return 'bountyPercentage';
    if (n.includes('pct_anio_1')) return 'year1Percentage';
    if (n.includes('pct_anio_2')) return 'year2Percentage';
    if (n.includes('meses_bounty')) return 'bountyMonths';
    if (n.includes('lockup')) return 'vestingMonths';
    if (n.includes('anio_vigencia')) return 'anio_vigencia';
    if (n.includes('activo')) return 'isActive';
    return h;
};

const mapGoalHeader = (h: string) => {
    const n = normalize(h);
    if (n === 'id') return 'id';
    if (n.includes('periodo')) return 'periodo';
    if (n.includes('meta_altas')) return 'meta_altas';
    if (n.includes('meta_partners')) return 'meta_partners';
    if (n.includes('meta_mrr')) return 'meta_mrr';
    if (n.includes('inicio')) return 'fecha_inicio';
    if (n.includes('fin')) return 'fecha_fin';
    return h;
};

export const fetchAndParseData = async (urls: AppSettings['sheetsUrls']) => {
    const results = {
        partners: [] as Partner[],
        companies: [] as Company[],
        subscriptions: [] as Subscription[],
        liquidations: [] as Liquidation[],
        plans: [] as CommercialPlan[],
        goals: [] as GoalTarget[],
        error: null as string | null
    };

    try {
        const fetchTable = async (urlKey: keyof typeof urls, mapper: (h: string) => string) => {
            const url = getExportUrl(urls[urlKey]);
            if (!url) return [];
            const res = await fetch(url);
            if (!res.ok) return [];
            return parseCSV(await res.text(), mapper);
        };

        const partnersData = await fetchTable('partners', mapPartnerHeader);
        results.partners = partnersData.map(row => ({
            ID_Partner: row['ID_Partner'],
            Nombre: row['Nombre'],
            Contacto: row['Contacto'],
            Email: row['Email'],
            Estado: (row['Estado'] as any) || 'Partner',
            Nivel: (row['Nivel'] as any) || 'Silver',
            Fecha_Alta: row['Fecha_Alta'],
            Liquida_com_partner: row['Liquida_com_partner']?.toLowerCase() === 'true'
        }));

        const companiesData = await fetchTable('companies', mapCompanyHeader);
        results.companies = companiesData.map(row => ({
            id: row['id'],
            nombre_empresa: row['nombre_empresa'],
            dominio: row['dominio'],
            id_partner: row['id_partner'],
            estado_global: row['estado_global'],
            fecha_conversion: row['fecha_conversion']
        }));

        const subsData = await fetchTable('subscriptions', mapSubscriptionHeader);
        results.subscriptions = subsData.map(row => ({
            ID_Suscripcion: row['ID_Suscripcion'],
            id_cliente: row['id_cliente'],
            id_incentivo: row['id_incentivo'],
            Cuota: parseFloat(row['Cuota'] || '0'),
            Tipo: row['Tipo'],
            Estado: (row['Estado'] as any) || 'Activa',
            Fecha_Inicio: row['Fecha_Inicio'],
            Fecha_Fin: row['Fecha_Fin'] || null,
            Saldo_Inicial: parseFloat(row['Saldo_Inicial'] || '0')
        }));

        const liqsData = await fetchTable('liquidations', mapLiquidationHeader);
        results.liquidations = liqsData.map(row => ({
            ID_Liquidacion: row['ID_Liquidacion'],
            ID_Partner: row['ID_Partner'],
            ID_Suscripcion: row['ID_Suscripcion'],
            Mes_Pagado: row['Mes_Pagado'],
            Monto: parseFloat(row['Monto'] || '0'),
            Fecha_Pago: row['Fecha_Pago']
        }));

        const plansData = await fetchTable('plans', mapPlanHeader);
        const plansMap: Record<string, CommercialPlan> = {};
        plansData.forEach(row => {
            const planId = row['anio_vigencia'] || '2025';
            if (!plansMap[planId]) {
                plansMap[planId] = {
                    id: planId,
                    nombre_programa: row['nombre_programa'] || 'Plan',
                    anio_vigencia: parseInt(row['anio_vigencia'] || '2025'),
                    isActive: row['isActive']?.toLowerCase() === 'true',
                    rules: []
                };
            }
            plansMap[planId].rules.push({
                tier: (row['nivel'] as any) || 'Silver',
                minCount: parseInt(row['minCount'] || '0'),
                maxCount: row['maxCount'] ? parseInt(row['maxCount']) : null,
                bountyMonths: parseInt(row['bountyMonths'] || '0'),
                bountyPercentage: parsePercentage(row['bountyPercentage']),
                year1Percentage: parsePercentage(row['year1Percentage']),
                year2Percentage: parsePercentage(row['year2Percentage']),
                vestingMonths: parseInt(row['vestingMonths'] || '6')
            });
        });
        results.plans = Object.values(plansMap);

        const goalsData = await fetchTable('goals', mapGoalHeader);
        results.goals = goalsData.map(row => ({
            id: row['id'],
            periodo: row['periodo'],
            meta_altas: parseInt(row['meta_altas'] || '0'),
            meta_partners: parseInt(row['meta_partners'] || '0'),
            meta_mrr: parseFloat(row['meta_mrr'] || '0'),
            fecha_inicio: row['fecha_inicio'],
            fecha_fin: row['fecha_fin']
        }));

    } catch (e) {
        results.error = "Error al sincronizar datos.";
    }
    return results;
};
