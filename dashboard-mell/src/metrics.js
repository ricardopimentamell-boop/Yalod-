import {
  GENERAL_STATS as G,
  CAMPAIGN_START,
  CAMPAIGN_END,
  HOLIDAYS,
  CUTOFF_DATE,
  CUTOFF_FRACTION,
  DAILY_NEW_SALES,
  EXPORT,
  PROJECTION_CHECKPOINTS,
  SERVICE_STATUS,
  CONTRACT_STATUS,
  MIGRATION_PRICES,
} from './data.js';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const parse = (iso) => new Date(`${iso}T12:00:00`);
const iso = (d) => d.toISOString().slice(0, 10);

export const isBusinessDay = (d) => d.getDay() !== 0 && !HOLIDAYS.includes(iso(d));

// Nº de dias úteis de CAMPAIGN_START até `date` (inclusive).
export function businessDaysThrough(date) {
  let n = 0;
  for (let d = parse(CAMPAIGN_START); d <= parse(date); d.setDate(d.getDate() + 1)) {
    if (isBusinessDay(d)) n += 1;
  }
  return n;
}

export const label = (date) => {
  const d = parse(date);
  return `${date.slice(8, 10)}/${date.slice(5, 7)} (${WEEKDAYS[d.getDay()]})`;
};

export const TOTAL_BUSINESS_DAYS = businessDaysThrough(CAMPAIGN_END);
const CUTOFF_IS_BUSINESS = isBusinessDay(parse(CUTOFF_DATE));
export const DAYS_ELAPSED = businessDaysThrough(CUTOFF_DATE) - (CUTOFF_IS_BUSINESS ? 1 - CUTOFF_FRACTION : 0);
export const REMAINING_DAYS = TOTAL_BUSINESS_DAYS - DAYS_ELAPSED;

// Produtividade realizada (calculada sobre os 39 consultores do período).
export const CURRENT_TEAM_PACE = G.newSalesCount / DAYS_ELAPSED;
export const PACE_PER_CONSULTANT = CURRENT_TEAM_PACE / G.initialConsultants;

export function project({ consultants, perConsultant, remainingDays, lossPct }) {
  const dailyTeam = consultants * perConsultant;
  const future = dailyTeam * remainingDays;
  const gross = G.newSalesCount + future;
  const net = gross * (1 - lossPct / 100);
  const missing = Math.max(G.targetGoal - G.newSalesCount, 0);
  return {
    dailyTeamSales: dailyTeam,
    futureSales: Math.round(future),
    grossTotal: Math.round(gross),
    netTotal: Math.round(net),
    diffVsTarget: Math.round(gross - G.targetGoal),
    netDiffVsTarget: Math.round(net - G.targetGoal),
    achievementRate: (gross / G.targetGoal) * 100,
    requiredTeamDaily: missing / remainingDays,
    requiredPerConsultant: missing / remainingDays / consultants,
  };
}

export const DEFAULT_SCENARIO = {
  consultants: G.currentConsultants,
  perConsultant: PACE_PER_CONSULTANT,
  remainingDays: REMAINING_DAYS,
  lossPct: 10,
};

export const BASE = project({ ...DEFAULT_SCENARIO, lossPct: 0 });
export const RISK = project(DEFAULT_SCENARIO);

// Acumulado diário real de vendas novas.
const DAILY_ACTUALS = DAILY_NEW_SALES.reduce((acc, p) => {
  const prev = acc.length ? acc[acc.length - 1].acumulado : 0;
  return [...acc, { date: p.date, qtd: p.qtd, acumulado: prev + p.qtd }];
}, []);
export { DAILY_ACTUALS };

// Projeção que separa seg-sex de sábado (sábado vende bem menos).
const isSaturday = (date) => parse(date).getDay() === 6;
// Dias completos: exclui o dia de corte, a menos que o export seja do fim do expediente.
const fullDays = DAILY_ACTUALS.filter((p) => p.date !== CUTOFF_DATE || CUTOFF_FRACTION >= 1);
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
export const WEEKDAY_PACE = avg(fullDays.filter((p) => !isSaturday(p.date)).map((p) => p.qtd));
export const SATURDAYS_OBSERVED = fullDays.filter((p) => isSaturday(p.date)).length;
// Sem sábado observado, não há base para separar: usa o ritmo de seg-sex.
export const SATURDAY_PACE = SATURDAYS_OBSERVED
  ? avg(fullDays.filter((p) => isSaturday(p.date)).map((p) => p.qtd))
  : WEEKDAY_PACE;

function remainingSplit() {
  // resto do dia de corte
  const rest = CUTOFF_IS_BUSINESS ? 1 - CUTOFF_FRACTION : 0;
  let weekdays = isSaturday(CUTOFF_DATE) ? 0 : rest;
  let saturdays = isSaturday(CUTOFF_DATE) ? rest : 0;
  const d = parse(CUTOFF_DATE);
  for (d.setDate(d.getDate() + 1); d <= parse(CAMPAIGN_END); d.setDate(d.getDate() + 1)) {
    if (!isBusinessDay(d)) continue;
    if (d.getDay() === 6) saturdays += 1;
    else weekdays += 1;
  }
  return { weekdays, saturdays };
}
export const REMAINING_SPLIT = remainingSplit();

export const SPLIT_PROJECTION = (() => {
  const scale = G.currentConsultants / G.initialConsultants;
  const future = (REMAINING_SPLIT.weekdays * WEEKDAY_PACE + REMAINING_SPLIT.saturdays * SATURDAY_PACE) * scale;
  const total = Math.round(G.newSalesCount + future);
  return { total, diff: total - G.targetGoal, rate: (total / G.targetGoal) * 100 };
})();

// Trajetória: realizado + projeção linear (ritmo atual, 38 consultores) + meta linear.
const linearGoal = (days) => Math.round((G.targetGoal / TOTAL_BUSINESS_DAYS) * days);
const projDaily = G.currentConsultants * PACE_PER_CONSULTANT;

export const TIMELINE_DATA = [
  ...DAILY_ACTUALS.map((p) => {
    const days = p.date === CUTOFF_DATE ? DAYS_ELAPSED : businessDaysThrough(p.date);
    const isCutoff = p.date === CUTOFF_DATE;
    return {
      x: days,
      day: label(p.date) + (isCutoff ? '*' : ''),
      realizado: p.acumulado,
      projecao: isCutoff ? p.acumulado : null,
      meta: linearGoal(days),
    };
  }),
  ...PROJECTION_CHECKPOINTS.map((date) => {
    const days = businessDaysThrough(date);
    return {
      x: days,
      day: label(date) + (date === CAMPAIGN_END ? ' Fim' : ''),
      realizado: null,
      projecao: Math.round(G.newSalesCount + projDaily * (days - DAYS_ELAPSED)),
      meta: linearGoal(days),
    };
  }),
];

const pct = (n, total) => (n / total) * 100;
const withPct = (rows, total) => rows.map((r) => ({ ...r, percentage: pct(r.count, total) }));

export const MIGRATION_ROWS = withPct(MIGRATION_PRICES, G.migrationsCount);
export const CONTRACT_ROWS = withPct(CONTRACT_STATUS, G.totalTransactions);

export const SERVICE_ROWS = withPct(SERVICE_STATUS, G.totalTransactions);

export const FIN = (() => {
  const newTicket = G.newSalesRevenue / G.newSalesCount;
  const migTicket = G.migrationsRevenue / G.migrationsCount;
  const avgTicket = G.totalRevenue / G.totalTransactions;
  const avgNoSva =
    (G.newSalesTicketNoSva * G.newSalesCount + G.migrationsTicketNoSva * G.migrationsCount) / G.totalTransactions;
  return {
    newTicket,
    migTicket,
    avgTicket,
    avgNoSva,
    newShare: pct(G.newSalesCount, G.totalTransactions),
    migShare: pct(G.migrationsCount, G.totalTransactions),
    newSva: newTicket - G.newSalesTicketNoSva,
    migSva: migTicket - G.migrationsTicketNoSva,
    avgSva: avgTicket - avgNoSva,
  };
})();

const ZERO = { count: 0, percentage: 0 };
const byName = (rows, name) => rows.find((s) => s.name === name) ?? ZERO;
export const STATUS = {
  cancelados: byName(SERVICE_STATUS, 'Cancelado'),
  aguardInstal: byName(SERVICE_STATUS, 'Aguardando Instalação'),
  aguardMig: byName(SERVICE_STATUS, 'Aguardando Migração'),
  naoAceito: byName(CONTRACT_ROWS, 'Não Aceito'),
  aceito: byName(CONTRACT_ROWS, 'Aceito'),
  semContrato: CONTRACT_ROWS.find((s) => s.name.startsWith('Sem Contrato')) ?? { count: 0, percentage: 0 },
};

// --- Cidades ---
const FLAGS = ['cancelado', 'aguard_inst', 'aguard_mig', 'habilitado', 'aceito', 'nao_aceito', 'sem_contrato'];

function emptyGeo(key) {
  return { key, cidades: new Set(), novo: 0, migrado: 0, receitaNovo: 0, receitaMig: 0, novoFlags: {}, allFlags: {} };
}

function groupGeo(keyFn) {
  const map = new Map();
  for (const r of EXPORT.por_cidade_origem) {
    const k = keyFn(r.cidade);
    if (!map.has(k)) map.set(k, emptyGeo(k));
    const g = map.get(k);
    g.cidades.add(r.cidade);
    if (r.origem === 'novo') {
      g.novo += r.qtd;
      g.receitaNovo += r.receita;
    } else {
      g.migrado += r.qtd;
      g.receitaMig += r.receita;
    }
    for (const f of FLAGS) {
      g.allFlags[f] = (g.allFlags[f] ?? 0) + r[f];
      if (r.origem === 'novo') g.novoFlags[f] = (g.novoFlags[f] ?? 0) + r[f];
    }
  }
  return [...map.values()]
    .map((g) => {
      const total = g.novo + g.migrado;
      const nf = (f) => g.novoFlags[f] ?? 0;
      return {
        key: g.key,
        novo: g.novo,
        migrado: g.migrado,
        total,
        receita: g.receitaNovo + g.receitaMig,
        ticketNovo: g.novo ? g.receitaNovo / g.novo : null,
        shareMeta: (g.novo / G.targetGoal) * 100,
        shareNovo: (g.novo / G.newSalesCount) * 100,
        novoCancelado: nf('cancelado'),
        novoAguardInst: nf('aguard_inst'),
        novoNaoAceito: nf('nao_aceito'),
        novoRisco: g.novo ? ((nf('cancelado') + nf('nao_aceito')) / g.novo) * 100 : null,
        cancelPct: total ? ((g.allFlags.cancelado ?? 0) / total) * 100 : 0,
        naoAceitoPct: total ? ((g.allFlags.nao_aceito ?? 0) / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.novo - a.novo || b.total - a.total);
}

export const CITY_ROWS = groupGeo((c) => c);

// Risco específico das vendas novas (não da base toda).
export const NEW_SALES_RISK = (() => {
  const t = CITY_ROWS.reduce(
    (s, c) => ({ canc: s.canc + c.novoCancelado, nao: s.nao + c.novoNaoAceito, inst: s.inst + c.novoAguardInst }),
    { canc: 0, nao: 0, inst: 0 },
  );
  return { ...t, cancPct: (t.canc / G.newSalesCount) * 100, naoPct: (t.nao / G.newSalesCount) * 100 };
})();
