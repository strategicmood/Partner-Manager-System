
import { Partner, Subscription, Liquidation, CommercialPlan, TierRule } from '../types';

// Helper to convert Edit URL to Export CSV URL
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
    console.error("Error parsing URL", e);
    return null; 
  }
};

// Robust Percentage Parser
// Handles: "20%", "0,2", "0.2", "20" -> 0.2
const parsePercentage = (val: string): number => {
    if (!val) return 0;
    // Replace comma with dot and remove %
    let cleaned = val.replace(',', '.').replace('%', '').trim();
    let n = parseFloat(cleaned);
    if (isNaN(n)) return 0;
    
    // Heuristic: If val had '%' OR value > 1, assume it needs division by 100
    // Exception: Bounties are often "1" (100%). If exactly 1, keep as 1.
    if (val.includes('%')) return n / 100;
    if (n > 1) return n / 100;
    
    return n;
};

// Robust CSV Parser with Column Mapping
const parseCSV = (text: string, columnMapper: (header: string) => string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    // 1. Parse Headers
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const headers = rawHeaders.map(h => columnMapper(h));
    
    // 2. Parse Rows
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        const obj: any = {};
        headers.forEach((h, i) => {
            if (values[i] !== undefined) {
                obj[h] = values[i];
            }
        });
        return obj;
    });
};

// --- HEADER MAPPERS (SPANISH & ENGLISH SUPPORT) ---

const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

const mapPartnerHeader = (h: string) => {
    const n = normalize(h);
    // Specific IDs first
    if (n.includes('idpartner') || n === 'id') return 'ID_Partner';

    // Prioritize Flags/Booleans that might contain "partner" to prevent mis-mapping to Name
    // Removed 'active' to prevent "Plan Active" from hijacking this field. Added 'liquidar'.
    if (n.includes('liquida') || n.includes('liquidar') || n.includes('comision') || n.includes('pagar')) return 'Liquida_com_partner';
    if (n.includes('estado') || n.includes('status')) return 'Estado';
    
    // Prioritize Plan
    if (n.includes('plan')) return 'PlanId';

    // Prioritize Contact fields
    if (n.includes('contacto') || n.includes('persona')) return 'Contacto';
    if (n.includes('email') || n.includes('correo')) return 'Email';
    if (n.includes('web') || n.includes('sitio')) return 'Web';

    // Name detection - Be stricter to avoid boolean columns
    if (n.includes('nombre') || n.includes('empresa') || n.includes('name') || n === 'partner') return 'Nombre';
    
    // Remaining fields
    if (n.includes('nivel') || n.includes('tier')) return 'Nivel';
    if (n.includes('fecha') || n.includes('alta')) return 'Fecha_Alta';
    
    return h;
};

const mapSubscriptionHeader = (h: string) => {
    const n = normalize(h);
    if (n.includes('idsuscripcion') || n === 'id') return 'ID_Suscripcion';
    if (n.includes('idpartner')) return 'ID_Partner';
    if (n.includes('cliente')) return 'Cliente';
    if (n.includes('inicio')) return 'Fecha_Inicio';
    if (n.includes('fin')) return 'Fecha_Fin';
    if (n.includes('cuota') || n.includes('mrr') || n.includes('fee')) return 'Cuota';
    if (n.includes('tipo')) return 'Tipo';
    if (n.includes('estado')) return 'Estado';
    if (n.includes('saldo')) return 'Saldo_Inicial';
    if (n.includes('pausado')) return 'Meses_Pausados';
    if (n.includes('calculo')) return 'Fecha_Calculo_Comision';
    return h;
};

const mapLiquidationHeader = (h: string) => {
    const n = normalize(h);
    if (n.includes('idliquidacion') || n === 'id') return 'ID_Liquidacion';
    if (n.includes('idpartner')) return 'ID_Partner';
    if (n.includes('cliente')) return 'Cliente';
    if (n.includes('mes')) return 'Mes_Pagado';
    if (n.includes('monto') || n.includes('importe')) return 'Monto';
    if (n.includes('fecha')) return 'Fecha_Pago';
    return h;
};

const mapPlanHeader = (h: string) => {
    const n = normalize(h);
    if (n.includes('planid') || n === 'id') return 'PlanId';
    if (n.includes('nombre') || n.includes('name')) return 'PlanName';
    if (n.includes('inicio') || n.includes('start')) return 'StartDate';
    if (n.includes('activo') || n.includes('active')) return 'IsActive';
    if (n.includes('defecto') || n.includes('default')) return 'IsDefault';
    
    // Tier Rules
    if (n.includes('nivel') || n.includes('tier')) return 'Tier';
    if (n.includes('min')) return 'MinCount';
    if (n.includes('max')) return 'MaxCount';
    if (n.includes('mesesbounty') || (n.includes('bounty') && n.includes('month'))) return 'BountyMonths';
    if (n.includes('porcentajebounty') || n.includes('%bounty') || (n.includes('bounty') && n.includes('cent'))) return 'BountyPercentage';
    if (n.includes('porcentajeaño1') || n.includes('%año1') || n.includes('year1')) return 'Year1Percentage';
    if (n.includes('porcentajeaño2') || n.includes('%año2') || n.includes('year2')) return 'Year2Percentage';
    if (n.includes('permanencia') || n.includes('vesting') || n.includes('lock')) return 'VestingMonths';
    
    return h;
};

// --- MAIN FETCH FUNCTION ---

export const fetchAndParseData = async (urls: { partners: string, subscriptions: string, liquidations: string, plans: string }) => {
    const results = {
        partners: [] as Partner[],
        subscriptions: [] as Subscription[],
        liquidations: [] as Liquidation[],
        plans: [] as CommercialPlan[],
        error: null as string | null
    };

    try {
        // 1. FETCH PARTNERS
        const pUrl = getExportUrl(urls.partners);
        if (pUrl) {
            const res = await fetch(pUrl);
            if (res.ok) {
                const text = await res.text();
                const data = parseCSV(text, mapPartnerHeader);
                results.partners = data.map(row => ({
                    ID_Partner: row['ID_Partner'] || `P-${Math.random().toString(36).substr(2,5)}`,
                    Nombre: row['Nombre'] || 'Sin Nombre',
                    Contacto: row['Contacto'] || '',
                    Email: row['Email'] || '',
                    Estado: (row['Estado'] === 'Partner' || row['Estado'] === 'Potential Partner') ? row['Estado'] : 'Partner',
                    Nivel: (row['Nivel'] as any) || 'Silver',
                    PlanId: row['PlanId'] || '',
                    Fecha_Alta: row['Fecha_Alta'] || new Date().toISOString().split('T')[0],
                    // Store logic flag if available, for robust parsing even if not used in UI yet
                    Liquida_com_partner: row['Liquida_com_partner'] ? (row['Liquida_com_partner'].toLowerCase() !== 'no' && row['Liquida_com_partner'] !== 'false') : true
                }));
            }
        }

        // 2. FETCH SUBSCRIPTIONS
        const sUrl = getExportUrl(urls.subscriptions);
        if (sUrl) {
            const res = await fetch(sUrl);
            if (res.ok) {
                const text = await res.text();
                const data = parseCSV(text, mapSubscriptionHeader);
                results.subscriptions = data.map(row => ({
                    ID_Suscripcion: row['ID_Suscripcion'] || `S-${Math.random().toString(36).substr(2,5)}`,
                    ID_Partner: row['ID_Partner'],
                    Cliente: row['Cliente'] || 'Cliente Desconocido',
                    Fecha_Inicio: row['Fecha_Inicio'] || new Date().toISOString().split('T')[0],
                    Fecha_Fin: row['Fecha_Fin'] || undefined,
                    Cuota: parseFloat(row['Cuota']?.replace('€', '').replace(',', '.') || '0'),
                    Tipo: (row['Tipo'] as any) || 'New',
                    Estado: (row['Estado'] as any) || 'Activo',
                    Saldo_Inicial: row['Saldo_Inicial'] ? parseFloat(row['Saldo_Inicial'].replace(',', '.')) : undefined,
                    Fecha_Calculo_Comision: row['Fecha_Calculo_Comision'] || undefined,
                    Meses_Pausados: row['Meses_Pausados'] || undefined
                }));
            }
        }

        // 3. FETCH LIQUIDATIONS
        const lUrl = getExportUrl(urls.liquidations);
        if (lUrl) {
            const res = await fetch(lUrl);
            if (res.ok) {
                const text = await res.text();
                const data = parseCSV(text, mapLiquidationHeader);
                results.liquidations = data.map(row => ({
                    ID_Liquidacion: row['ID_Liquidacion'] || `L-${Math.random().toString(36).substr(2,5)}`,
                    ID_Partner: row['ID_Partner'],
                    Cliente: row['Cliente'],
                    Mes_Pagado: row['Mes_Pagado'],
                    Monto: parseFloat(row['Monto']?.replace('€', '').replace(',', '.') || '0'),
                    Fecha_Pago: row['Fecha_Pago']
                }));
            }
        }

        // 4. FETCH PLANS (With Enhanced Parsing)
        const plUrl = getExportUrl(urls.plans);
        if (plUrl) {
            const res = await fetch(plUrl);
            if (res.ok) {
                const text = await res.text();
                const data = parseCSV(text, mapPlanHeader);
                
                const plansMap: Record<string, CommercialPlan> = {};
                
                data.forEach(row => {
                    // Skip empty rows
                    if (!row['Tier'] && !row['PlanName']) return;

                    const planId = row['PlanId'] || 'DEFAULT';
                    
                    if (!plansMap[planId]) {
                        plansMap[planId] = {
                            id: planId,
                            name: row['PlanName'] || 'Plan Comercial',
                            startDate: row['StartDate'] || '2024-01-01',
                            isActive: String(row['IsActive']).toLowerCase() === 'true' || row['IsActive'] === '1',
                            isDefault: String(row['IsDefault']).toLowerCase() === 'true' || row['IsDefault'] === '1',
                            rules: []
                        };
                    }

                    const rule: TierRule = {
                        tier: (row['Tier'] as any) || 'Silver',
                        minCount: parseInt(row['MinCount'] || '0'),
                        maxCount: (row['MaxCount'] && row['MaxCount'].toLowerCase() !== 'infinity') ? parseInt(row['MaxCount']) : null,
                        bountyMonths: parseInt(row['BountyMonths'] || '0'),
                        
                        // Use smart parser for percentages
                        bountyPercentage: parsePercentage(row['BountyPercentage']),
                        year1Percentage: parsePercentage(row['Year1Percentage']),
                        year2Percentage: parsePercentage(row['Year2Percentage']),
                        
                        vestingMonths: parseInt(row['VestingMonths'] || '6')
                    };

                    plansMap[planId].rules.push(rule);
                });

                results.plans = Object.values(plansMap);
            }
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        results.error = "Error conectando con Google Sheets. Verifica permisos y formato.";
    }

    return results;
};
