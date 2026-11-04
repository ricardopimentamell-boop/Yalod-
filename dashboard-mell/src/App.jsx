import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  BarChart2,
  PieChart as PieIcon,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { GENERAL_STATS } from './data.js';
import {
  TOTAL_BUSINESS_DAYS,
  DAYS_ELAPSED,
  REMAINING_DAYS,
  CURRENT_TEAM_PACE,
  PACE_PER_CONSULTANT,
  DEFAULT_SCENARIO,
  BASE,
  RISK,
  TIMELINE_DATA,
  MIGRATION_ROWS,
  SERVICE_ROWS,
  CONTRACT_ROWS,
  FIN,
  STATUS,
  project,
} from './metrics.js';

const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatNum = (val, digits = 0) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val);
const formatPct = (val, digits = 1) => `${formatNum(val, digits)}%`;
const signed = (n) => (n >= 0 ? `+${formatNum(n)}` : formatNum(n));

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' };
// Eixo X proporcional aos dias úteis, para não distorcer a inclinação.
const TICKS = TIMELINE_DATA.filter((_, i) => i % 2 === 1 || i >= 7).map((d) => d.x);
const TICK_LABEL = Object.fromEntries(TIMELINE_DATA.map((d) => [d.x, d.day]));
const SERIES_NAMES = { realizado: 'Realizado', projecao: 'Projeção', meta: 'Meta linear' };

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // Estado do simulador
  const [consultants, setConsultants] = useState(DEFAULT_SCENARIO.consultants);
  const [perConsultant, setPerConsultant] = useState(DEFAULT_SCENARIO.perConsultant);
  const [remainingDays, setRemainingDays] = useState(DEFAULT_SCENARIO.remainingDays);
  const [lossPct, setLossPct] = useState(DEFAULT_SCENARIO.lossPct);

  const sim = useMemo(
    () => project({ consultants, perConsultant, remainingDays, lossPct }),
    [consultants, perConsultant, remainingDays, lossPct],
  );

  const resetSimulator = () => {
    setConsultants(DEFAULT_SCENARIO.consultants);
    setPerConsultant(DEFAULT_SCENARIO.perConsultant);
    setRemainingDays(DEFAULT_SCENARIO.remainingDays);
    setLossPct(DEFAULT_SCENARIO.lossPct);
  };

  const goal = GENERAL_STATS.targetGoal;
  const baseOk = BASE.diffVsTarget >= 0;
  const riskOk = RISK.netDiffVsTarget >= 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Mell Internet</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  RevOps & BI
                </span>
              </div>
              <p className="text-xs text-slate-400">Dashboard Executivo de Vendas & Migrações | Campanha Out-Dez 2026</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Base: <strong className="text-slate-200">{GENERAL_STATS.period}</strong></span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Equipe: <strong className="text-slate-200">{GENERAL_STATS.currentConsultants} Consultores</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
            { id: 'projection', label: `Projeção & Meta ${goal}`, icon: Target },
            { id: 'funnel', label: 'Funil & Riscos (Aceite)', icon: ShieldAlert },
            { id: 'simulator', label: 'Simulador Executivo', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total da Base</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {formatNum(GENERAL_STATS.totalTransactions)} <span className="text-sm font-normal text-slate-400">contratos</span>
                </h3>
              </div>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
              <span className="text-slate-400">Receita total (c/ SVA):</span>
              <span className="font-semibold text-slate-200">{formatBRL(GENERAL_STATS.totalRevenue)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Ticket Médio Geral:</span>
              <span className="font-semibold text-emerald-400">{formatBRL(FIN.avgTicket)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vendas Novas (Realizado)</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                  {GENERAL_STATS.newSalesCount} <span className="text-sm font-normal text-slate-400">vendas</span>
                </h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
              <span className="text-slate-400">Receita Vendas:</span>
              <span className="font-semibold text-slate-200">{formatBRL(GENERAL_STATS.newSalesRevenue)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Ticket Médio (c/ SVA):</span>
              <span className="font-semibold text-emerald-400">{formatBRL(FIN.newTicket)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Migrações ({formatPct(FIN.migShare)} Base)
                </p>
                <h3 className="text-2xl font-bold text-violet-400 mt-1">
                  {GENERAL_STATS.migrationsCount} <span className="text-sm font-normal text-slate-400">clientes</span>
                </h3>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
              <span className="text-slate-400">Receita Renovada:</span>
              <span className="font-semibold text-slate-200">{formatBRL(GENERAL_STATS.migrationsRevenue)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Ticket Médio Migrações:</span>
              <span className="font-semibold text-violet-300">{formatBRL(FIN.migTicket)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-indigo-900/50 bg-gradient-to-br from-indigo-950/30 to-slate-900 rounded-xl p-5 relative overflow-hidden group hover:border-indigo-700/50 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Meta Desafio (Vendas)</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <h3 className="text-2xl font-bold text-white">{BASE.grossTotal}</h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      baseOk
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {formatPct(BASE.achievementRate)} (Proj)
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
              <span className="text-slate-400">Meta Estabelecida:</span>
              <span className="font-bold text-slate-200">{goal} Vendas</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Folga bruta / c/ {DEFAULT_SCENARIO.lossPct}% perda:</span>
              <span className="font-bold">
                <span className={baseOk ? 'text-emerald-400' : 'text-red-400'}>{signed(BASE.diffVsTarget)}</span>
                <span className="text-slate-500"> / </span>
                <span className={riskOk ? 'text-emerald-400' : 'text-red-400'}>{signed(RISK.netDiffVsTarget)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ALERT BANNER */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5 md:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-200">Atenção Executiva: Riscos no Funil de Conversão</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Existem{' '}
                <strong className="text-amber-100">
                  {STATUS.naoAceito.count} contratos sem aceite ({formatPct(STATUS.naoAceito.percentage)})
                </strong>{' '}
                e{' '}
                <strong className="text-red-300">
                  {STATUS.cancelados.count} cancelamentos ({formatPct((STATUS.cancelados.count / GENERAL_STATS.totalTransactions) * 100)})
                </strong>{' '}
                na base. A projeção bruta tem folga de <strong>{signed(BASE.diffVsTarget)}</strong>; com{' '}
                {DEFAULT_SCENARIO.lossPct}% de perda, o resultado líquido fica em{' '}
                <strong className={riskOk ? 'text-emerald-300' : 'text-red-300'}>{signed(RISK.netDiffVsTarget)} vendas</strong> vs. a meta.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('funnel')}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold whitespace-nowrap transition"
          >
            Ver Detalhes do Funil &rarr;
          </button>
        </div>

        {/* TAB 1 - OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Composição da Base: Vendas vs. Migrações</h3>
                    <p className="text-xs text-slate-400">Proporção de {GENERAL_STATS.totalTransactions} registros processados</p>
                  </div>
                  <PieIcon className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Migrações', value: GENERAL_STATS.migrationsCount },
                          { name: 'Vendas Novas', value: GENERAL_STATS.newSalesCount },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#8b5cf6" />
                        <Cell key="cell-1" fill="#10b981" />
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val) => [
                          `${val} contratos (${formatPct((val / GENERAL_STATS.totalTransactions) * 100)})`,
                          'Volume',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Migrações ({formatPct(FIN.migShare, 2)})</p>
                      <p className="text-base font-bold text-slate-100">
                        {GENERAL_STATS.migrationsCount}{' '}
                        <span className="text-xs font-normal text-slate-400">({formatBRL(GENERAL_STATS.migrationsRevenue)})</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Vendas Novas ({formatPct(FIN.newShare, 2)})</p>
                      <p className="text-base font-bold text-slate-100">
                        {GENERAL_STATS.newSalesCount}{' '}
                        <span className="text-xs font-normal text-slate-400">({formatBRL(GENERAL_STATS.newSalesRevenue)})</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-white">Distribuição dos Valores de Migração</h3>
                    <p className="text-xs text-slate-400">Valor do plano final contratado pós-migração</p>
                  </div>
                  <BarChart2 className="w-5 h-5 text-violet-400" />
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MIGRATION_ROWS} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="range" type="category" stroke="#cbd5e1" fontSize={11} width={130} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val, name, item) => [`${val} clientes (${formatPct(item.payload.percentage, 2)})`, 'Volume']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {MIGRATION_ROWS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      <strong>Nota Metodológica:</strong> O relatório não inclui o histórico do valor prévio (ARPU anterior).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Detalhamento Financeiro & Comparativo de SVA</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4">Vol. Contratos</th>
                      <th className="py-3 px-4">% da Base</th>
                      <th className="py-3 px-4">Receita Total (c/ SVA)</th>
                      <th className="py-3 px-4">Ticket Médio (c/ SVA)</th>
                      <th className="py-3 px-4">Ticket Médio (s/ SVA)</th>
                      <th className="py-3 px-4">Impacto SVA / Contrato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                    <tr className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-emerald-400 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Vendas Novas</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{GENERAL_STATS.newSalesCount}</td>
                      <td className="py-3 px-4">{formatPct(FIN.newShare, 2)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{formatBRL(GENERAL_STATS.newSalesRevenue)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{formatBRL(FIN.newTicket)}</td>
                      <td className="py-3 px-4 text-slate-400">{formatBRL(GENERAL_STATS.newSalesTicketNoSva)}</td>
                      <td className="py-3 px-4 text-emerald-300 font-semibold">+ {formatBRL(FIN.newSva)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-violet-400 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        <span>Migrações</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{GENERAL_STATS.migrationsCount}</td>
                      <td className="py-3 px-4">{formatPct(FIN.migShare, 2)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{formatBRL(GENERAL_STATS.migrationsRevenue)}</td>
                      <td className="py-3 px-4 font-bold text-violet-300">{formatBRL(FIN.migTicket)}</td>
                      <td className="py-3 px-4 text-slate-400">{formatBRL(GENERAL_STATS.migrationsTicketNoSva)}</td>
                      <td className="py-3 px-4 text-emerald-300 font-semibold">+ {formatBRL(FIN.migSva)}</td>
                    </tr>
                    <tr className="bg-slate-950 font-bold border-t border-slate-700 text-white">
                      <td className="py-3.5 px-4 text-indigo-300">TOTAL GERAL BASE</td>
                      <td className="py-3.5 px-4">{GENERAL_STATS.totalTransactions}</td>
                      <td className="py-3.5 px-4">100,0%</td>
                      <td className="py-3.5 px-4 text-indigo-300">{formatBRL(GENERAL_STATS.totalRevenue)}</td>
                      <td className="py-3.5 px-4 text-indigo-400">{formatBRL(FIN.avgTicket)}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatBRL(FIN.avgNoSva)}</td>
                      <td className="py-3.5 px-4 text-emerald-400">+ {formatBRL(FIN.avgSva)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 - PROJECTION */}
        {activeTab === 'projection' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">
                  Ritmo Atual Realizado ({GENERAL_STATS.initialConsultants} Consultores)
                </p>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-white">{formatNum(CURRENT_TEAM_PACE, 1)}</span>
                  <span className="text-xs text-slate-400">vendas novas / dia útil</span>
                </div>
                <p className="text-xs text-emerald-400 mt-2 font-medium">
                  Produtividade: {formatNum(PACE_PER_CONSULTANT, 3)} vendas/consultor/dia
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">
                  Ritmo Necessário para a Meta ({GENERAL_STATS.currentConsultants} Consultores)
                </p>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-indigo-400">{formatNum(BASE.requiredTeamDaily, 1)}</span>
                  <span className="text-xs text-slate-400">vendas novas / dia útil</span>
                </div>
                <p className="text-xs text-indigo-300 mt-2 font-medium">
                  Exigência: {formatNum(BASE.requiredPerConsultant, 3)} vendas/consultor/dia
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">Projeção de Fechamento (05/12)</p>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className={`text-3xl font-extrabold ${baseOk ? 'text-emerald-400' : 'text-red-400'}`}>{BASE.grossTotal}</span>
                  <span className="text-xs text-slate-400">vendas novas esperadas</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Meta: {goal} |{' '}
                  <strong className={baseOk ? 'text-emerald-400' : 'text-red-400'}>{signed(BASE.diffVsTarget)} vendas de folga</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Trajetória Acumulada: Realizado vs Projeção vs Meta {goal}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {TOTAL_BUSINESS_DAYS} dias úteis (seg-sáb; exclui feriados 02/11, 15/11 e 20/11). * Corte em 04/11 às 12h.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span>Realizado ({GENERAL_STATS.newSalesCount})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                    <span>Projeção ({BASE.grossTotal})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-red-400 inline-block" />
                    <span>Meta linear ({goal})</span>
                  </div>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={TIMELINE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={[0, TOTAL_BUSINESS_DAYS]}
                      ticks={TICKS}
                      tickFormatter={(x) => TICK_LABEL[x]?.slice(0, 5) ?? ''}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 900]} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(x) => `${TICK_LABEL[x] ?? ''} — dia útil ${formatNum(x, 1)}`}
                      formatter={(val, name) => [val != null ? `${val} vendas` : 'N/A', SERIES_NAMES[name] ?? name]}
                    />
                    <ReferenceLine
                      y={goal}
                      label={{ value: `META DESAFIO: ${goal}`, fill: '#f87171', fontSize: 12, position: 'top' }}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                    />
                    <Area type="linear" dataKey="projecao" stroke="#6366f1" strokeWidth={2} fill="url(#colorProjecao)" name="projecao" connectNulls />
                    <Area type="monotone" dataKey="realizado" stroke="#10b981" strokeWidth={3} fill="url(#colorRealizado)" name="realizado" />
                    <Line type="linear" dataKey="meta" stroke="#f87171" strokeWidth={1.5} dot={false} name="meta" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-indigo-300 mb-1">Cenário A: Apenas Vendas Novas (Foco da Meta)</h4>
                  <p className="text-slate-400">
                    Ao ritmo de {formatNum(PACE_PER_CONSULTANT, 3)} vendas/consultor/dia com {GENERAL_STATS.currentConsultants} consultores
                    nos {formatNum(REMAINING_DAYS, 1)} dias úteis restantes, projetam-se +{BASE.futureSales} vendas novas, alcançando{' '}
                    <strong>
                      {BASE.grossTotal} contratos ({formatPct(BASE.achievementRate)} da meta)
                    </strong>
                    . Premissa: ritmo constante e sem perdas.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-violet-300 mb-1">Cenário B: Volume Total (Novas + Migrações)</h4>
                  <p className="text-slate-400">
                    Se a meta considerasse o volume global da campanha (Vendas + Migrações), os {GENERAL_STATS.totalTransactions} registros
                    já representariam{' '}
                    <strong>
                      {formatPct((GENERAL_STATS.totalTransactions / goal) * 100)} da meta em {formatNum(DAYS_ELAPSED, 1)} dias
                    </strong>
                    . Leitura apenas ilustrativa: a meta oficial é de vendas novas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 - FUNNEL */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-1">Status Operacional dos Serviços</h3>
                <p className="text-xs text-slate-400 mb-4">Situação física/técnica da instalação e habilitação</p>

                <div className="space-y-4">
                  {SERVICE_ROWS.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200">{item.name}</span>
                        <span className="text-slate-400">
                          {item.count} contratos ({formatPct(item.percentage, 2)})
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2 text-xs text-red-300">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>
                      {STATUS.cancelados.count} Contratos Cancelados (
                      {formatPct((STATUS.cancelados.count / GENERAL_STATS.totalTransactions) * 100, 2)}):
                    </strong>{' '}
                    Perda de receita e de tempo operacional da equipe. O export não separa quantos são vendas novas vs. migrações.
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-1">Aceite Jurídico do Contrato</h3>
                <p className="text-xs text-slate-400 mb-4">Assinatura / Validação digital do cliente no Hubsoft</p>

                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={CONTRACT_ROWS} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="count">
                        {CONTRACT_ROWS.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} contratos`, 'Quantidade']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-3 border-t border-slate-800">
                  {[
                    { row: STATUS.aceito, label: 'Contrato Aceito', box: 'bg-emerald-500/10 border-emerald-500/20', t1: 'text-emerald-400', t2: 'text-emerald-300' },
                    { row: STATUS.naoAceito, label: 'Não Aceito', box: 'bg-red-500/10 border-red-500/20', t1: 'text-red-400', t2: 'text-red-300' },
                    { row: STATUS.semContrato, label: 'Sem Contrato', box: 'bg-amber-500/10 border-amber-500/20', t1: 'text-amber-400', t2: 'text-amber-300' },
                  ].map(({ row, label: l, box, t1, t2 }) => (
                    <div key={l} className={`p-2 rounded-lg border ${box}`}>
                      <p className={`text-xs font-medium ${t1}`}>{l}</p>
                      <p className={`text-lg font-bold ${t2}`}>{row.count}</p>
                      <p className="text-[10px] text-slate-400">{formatPct(row.percentage, 2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>Plano de Ação Sugerido para Recuperação de Receita</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">1. Mutirão de Aceite</span>
                  <p className="text-xs text-slate-300 mt-2">
                    Disparar régua de acionamento via WhatsApp / SMS com link simplificado para os{' '}
                    <strong>{STATUS.naoAceito.count} clientes "Não Aceito"</strong> para evitar estornos na meta.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">2. Agilização de Instalações</span>
                  <p className="text-xs text-slate-300 mt-2">
                    Priorizar a agenda técnica para os <strong>{STATUS.aguardInstal.count} contratos aguardando instalação</strong> e{' '}
                    <strong>{STATUS.aguardMig.count} aguardando migração</strong> para reconhecer faturamento.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">3. Cruzamento de Base de ARPU</span>
                  <p className="text-xs text-slate-300 mt-2">
                    Cruzar com a folha de cobrança de Setembro para identificar se as {GENERAL_STATS.migrationsCount} migrações geraram
                    ganho real de receita (Upgrade) ou apenas renovação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 - SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-indigo-900/40 rounded-xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Simulador de Metas & Dimensionamento de Equipe</h3>
                    <p className="text-xs text-slate-400">Ajuste os parâmetros da equipe e projete o resultado final em tempo real</p>
                  </div>
                </div>
                <button
                  onClick={resetSimulator}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="space-y-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase">Consultores Ativos</label>
                      <span className="text-sm font-bold text-indigo-400">{consultants} consultores</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="45"
                      step="1"
                      value={consultants}
                      onChange={(e) => setConsultants(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>25 min</span>
                      <span>{GENERAL_STATS.currentConsultants} (Hoje)</span>
                      <span>45 max</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase">Vendas / Consultor / Dia</label>
                      <span className="text-sm font-bold text-emerald-400">{formatNum(perConsultant, 3)} vendas</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.001"
                      value={perConsultant}
                      onChange={(e) => setPerConsultant(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0,30 (Baixo)</span>
                      <span>{formatNum(PACE_PER_CONSULTANT, 3)} (Atual)</span>
                      <span>1,00 (Alto)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase">Dias Úteis Restantes</label>
                      <span className="text-sm font-bold text-violet-400">{formatNum(remainingDays, 1)} dias</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="30"
                      step="0.5"
                      value={remainingDays}
                      onChange={(e) => setRemainingDays(Number(e.target.value))}
                      className="w-full accent-violet-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>15 dias</span>
                      <span>{formatNum(REMAINING_DAYS, 1)} (Oficial)</span>
                      <span>30 dias</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase">Perda / Desistência (Gargalo Aceite)</label>
                      <span className="text-sm font-bold text-red-400">{lossPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={lossPct}
                      onChange={(e) => setLossPct(Number(e.target.value))}
                      className="w-full accent-red-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0% (Sem perdas)</span>
                      <span>10% (Médio)</span>
                      <span>25% (Pessimista)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Projeção Bruta de Vendas Novas</p>
                      <h4 className="text-3xl font-extrabold text-white mt-1">
                        {sim.grossTotal} <span className="text-sm font-normal text-slate-400">vendas</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-2">
                        Realizado ({GENERAL_STATS.newSalesCount}) + Futuro ({sim.futureSales})
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs flex justify-between">
                        <span className="text-slate-400">Produtividade Diária da Equipe:</span>
                        <span className="font-bold text-indigo-400">{formatNum(sim.dailyTeamSales, 1)} vendas/dia</span>
                      </div>
                    </div>

                    <div
                      className={`border p-5 rounded-xl ${
                        sim.diffVsTarget >= 0 ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-red-950/20 border-red-500/40'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-400 uppercase">Status perante a Meta ({goal})</p>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <h4 className={`text-3xl font-extrabold ${sim.diffVsTarget >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {signed(sim.diffVsTarget)}
                        </h4>
                        <span className="text-sm text-slate-400">vendas da meta</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 font-medium">
                        Atingimento Estimado: <strong>{formatPct(sim.achievementRate)}</strong>
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs flex justify-between">
                        <span className="text-slate-400">Exigência Diária / Consultor:</span>
                        <span className="font-bold text-slate-200">{formatNum(sim.requiredPerConsultant, 3)} vendas/dia</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <h4 className="text-sm font-semibold text-white flex items-center space-x-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Cenário Ajustado por Risco de Cancelamento/Sem Aceite ({lossPct}% de Perda)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800 text-xs">
                      <div>
                        <p className="text-slate-400">Vendas Novas Líquidas Estimadas:</p>
                        <p className="text-2xl font-bold text-amber-300 mt-0.5">{sim.netTotal} contratos</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Balanço Líquido vs Meta {goal}:</p>
                        <p className={`text-2xl font-bold mt-0.5 ${sim.netDiffVsTarget >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {signed(sim.netDiffVsTarget)} vendas
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-3">
                      Para bater a meta líquida com {lossPct}% de perda, seriam necessárias{' '}
                      {formatNum(goal / (1 - lossPct / 100))} vendas brutas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>Mell Internet BI & Revenue Operations © 2026. Todos os direitos reservados.</p>
        <p>Fonte dos dados: Hubsoft export - Relatório de Serviços ({GENERAL_STATS.period}).</p>
      </footer>
    </div>
  );
}
