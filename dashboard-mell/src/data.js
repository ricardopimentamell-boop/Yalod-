import EXPORT from './export.json';

export { EXPORT };

// Dados de entrada (export Hubsoft — Relatório de Serviços, 26/10 a 04/11/2026 12h).
// Tudo que é projeção/percentual é calculado em metrics.js a partir daqui.

export const GENERAL_STATS = {
  period: '26/10/2026 a 04/11/2026 (12h)',
  projectionPeriod: '04/11 a 05/12/2026',
  totalTransactions: 948,
  totalRevenue: 85836.33,

  newSalesCount: 192,
  newSalesRevenue: 16747.59,
  newSalesTicketNoSva: 85.79,

  migrationsCount: 756,
  migrationsRevenue: 69088.74,
  migrationsTicketNoSva: 89.29,

  targetGoal: 796,
  initialConsultants: 39,
  currentConsultants: 38,
};

// Calendário da campanha: dias úteis = seg-sáb, exceto feriados.
export const CAMPAIGN_START = '2026-10-26';
export const CAMPAIGN_END = '2026-12-05';
export const HOLIDAYS = ['2026-11-02', '2026-11-15', '2026-11-20'];
// Data de corte do export: 04/11 às 12h = meio dia útil.
export const CUTOFF_DATE = '2026-11-04';
export const CUTOFF_FRACTION = 0.5;

// Vendas novas por dia (data de cadastro), vindas do export via scripts/build_data.py.
export const DAILY_NEW_SALES = EXPORT.vendas_novas_por_dia;

// Pontos futuros exibidos no gráfico.
export const PROJECTION_CHECKPOINTS = ['2026-11-10', '2026-11-17', '2026-11-24', '2026-12-01', '2026-12-05'];

export const MIGRATION_PRICES = [
  { range: 'R$ 79,90 (Combo 300M)', count: 427, color: '#6366f1' },
  { range: 'R$ 99,90 (600M)', count: 127, color: '#8b5cf6' },
  { range: 'R$ 109,90 - 124,90 (Giga)', count: 102, color: '#ec4899' },
  { range: 'Outros / Customizados', count: 100, color: '#94a3b8' },
];

export const SERVICE_STATUS = [
  { name: 'Habilitado', count: 717, fill: '#10b981' },
  { name: 'Aguardando Migração', count: 96, fill: '#3b82f6' },
  { name: 'Cancelado', count: 70, fill: '#ef4444' },
  { name: 'Aguardando Instalação', count: 63, fill: '#f59e0b' },
  { name: 'Suspenso Parcialmente', count: 2, fill: '#64748b' },
];

export const CONTRACT_STATUS = [
  { name: 'Aceito', count: 676, color: '#10b981' },
  { name: 'Não Aceito', count: 184, color: '#ef4444' },
  { name: 'Sem Contrato / Traçado', count: 88, color: '#f59e0b' },
];
