import EXPORT from './export.json';

export { EXPORT };

// --- Parâmetros manuais (mudam pouco; edite aqui) ---
export const TARGET_GOAL = 796;
export const INITIAL_CONSULTANTS = 39; // equipe no início da campanha (base do ritmo realizado)
export const CURRENT_CONSULTANTS = 38; // equipe hoje (base da projeção)
// Horário comercial usado para saber quanto do dia de corte já passou.
export const WORKDAY_START_HOUR = 8;
export const WORKDAY_END_HOUR = 18;

// --- Tudo abaixo vem do export (src/export.json, gerado por scripts/build_data.py) ---
const T = EXPORT.totais;
const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const CUT = EXPORT.corte; // "2026-11-04T12:07"
const cutHour = Number(CUT.slice(11, 13)) + Number(CUT.slice(14, 16)) / 60;

// Calendário da campanha: dias úteis = seg-sáb, exceto feriados.
export const CAMPAIGN_START = '2026-10-26';
export const CAMPAIGN_END = '2026-12-05';
export const HOLIDAYS = ['2026-11-02', '2026-11-15', '2026-11-20'];
// Corte do export: dia e fração do dia comercial já decorrida.
export const CUTOFF_DATE = CUT.slice(0, 10);
export const CUTOFF_FRACTION = Math.min(
  Math.max((cutHour - WORKDAY_START_HOUR) / (WORKDAY_END_HOUR - WORKDAY_START_HOUR), 0),
  1,
);

export const GENERAL_STATS = {
  period: `${dm(CAMPAIGN_START)} a ${dm(CUTOFF_DATE)} (${CUT.slice(11, 16).replace(':', 'h')})`,
  cutoffLabel: `${dm(CUTOFF_DATE).slice(0, 5)} às ${CUT.slice(11, 16).replace(':', 'h')}`,
  generatedAt: EXPORT.gerado_em,
  totalTransactions: T.geral.qtd,
  totalRevenue: T.geral.receita,
  newSalesCount: T.novo.qtd,
  newSalesRevenue: T.novo.receita,
  newSalesTicketNoSva: T.novo.receita_sem_sva / T.novo.qtd,
  migrationsCount: T.migrado.qtd,
  migrationsRevenue: T.migrado.receita,
  migrationsTicketNoSva: T.migrado.receita_sem_sva / T.migrado.qtd,
  targetGoal: TARGET_GOAL,
  initialConsultants: INITIAL_CONSULTANTS,
  currentConsultants: CURRENT_CONSULTANTS,
};

// Vendas novas por dia (data de cadastro), vindas do export via scripts/build_data.py.
export const DAILY_NEW_SALES = EXPORT.vendas_novas_por_dia;

// Pontos futuros do gráfico: a cada 7 dias após o corte, até o fim da campanha.
export const PROJECTION_CHECKPOINTS = (() => {
  const out = [];
  const d = new Date(`${CUTOFF_DATE}T12:00:00`);
  for (d.setDate(d.getDate() + 6); d < new Date(`${CAMPAIGN_END}T12:00:00`); d.setDate(d.getDate() + 7)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return [...out, CAMPAIGN_END];
})();

const MIGRATION_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#94a3b8'];
export const MIGRATION_PRICES = EXPORT.faixas_migracao.map((b, i) => ({ ...b, color: MIGRATION_COLORS[i] ?? '#64748b' }));

const STATUS_STYLE = {
  'Serviço Habilitado': { name: 'Habilitado', fill: '#10b981' },
  'Aguardando Migração': { fill: '#3b82f6' },
  Cancelado: { fill: '#ef4444' },
  'Aguardando Instalação': { fill: '#f59e0b' },
};
export const SERVICE_STATUS = Object.entries(EXPORT.status_servico).map(([name, count]) => ({
  name,
  count,
  fill: '#64748b',
  ...STATUS_STYLE[name],
}));

const CONTRACT_COLORS = { Aceito: '#10b981', 'Não Aceito': '#ef4444', 'Sem Contrato': '#f59e0b' };
export const CONTRACT_STATUS = Object.entries(EXPORT.status_contrato).map(([name, count]) => ({
  name,
  count,
  color: CONTRACT_COLORS[name] ?? '#64748b',
}));
