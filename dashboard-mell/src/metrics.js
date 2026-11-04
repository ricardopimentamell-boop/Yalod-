import {
  GENERAL_STATS as G,
  CAMPAIGN_START,
  CAMPAIGN_END,
  HOLIDAYS,
  CUTOFF_DATE,
  CUTOFF_FRACTION,
  DAILY_ACTUALS,
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
export const DAYS_ELAPSED = businessDaysThrough(CUTOFF_DATE) - 1 + CUTOFF_FRACTION;
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

// O export soma 946 nos 4 status; a diferença aparece como linha própria.
const statusSum = SERVICE_STATUS.reduce((s, r) => s + r.count, 0);
const statusGap = G.totalTransactions - statusSum;
export const SERVICE_ROWS = withPct(
  statusGap > 0 ? [...SERVICE_STATUS, { name: 'Sem status / outros', count: statusGap, fill: '#64748b' }] : SERVICE_STATUS,
  G.totalTransactions,
);

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

export const STATUS = {
  cancelados: SERVICE_STATUS.find((s) => s.name === 'Cancelado'),
  aguardInstal: SERVICE_STATUS.find((s) => s.name === 'Aguardando Instalação'),
  aguardMig: SERVICE_STATUS.find((s) => s.name === 'Aguardando Migração'),
  naoAceito: CONTRACT_ROWS.find((s) => s.name === 'Não Aceito'),
  aceito: CONTRACT_ROWS.find((s) => s.name === 'Aceito'),
  semContrato: CONTRACT_ROWS.find((s) => s.name.startsWith('Sem Contrato')),
};
