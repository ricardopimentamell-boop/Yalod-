import React, { useMemo, useState } from 'react';
import { MapPin, CalendarRange } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { GENERAL_STATS } from './data.js';
import { aggregateCities, sumRows, GEO_DAYS, BASE_REF } from './metrics.js';

const fmt = (v, d = 0) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const brl = (v) => (v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v));
const brl0 = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
const pct = (v, d = 1) => (v == null || !isFinite(v) ? '—' : `${fmt(v, d)}%`);
const signedBrl = (v) => (v > 0 ? `+${brl(v)}` : brl(v));
const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dayLabel = (iso) => `${dm(iso)} (${WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()]})`;
const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' };

// Risco das vendas novas = (canceladas + sem aceite) / vendas novas.
const riskClass = (v, n) => {
  if (v == null || n < 5) return 'text-slate-500';
  if (v >= 30) return 'text-red-400 font-semibold';
  if (v >= 15) return 'text-amber-300';
  return 'text-emerald-400';
};

const first = GEO_DAYS[0];
const last = GEO_DAYS[GEO_DAYS.length - 1];
const PRESETS = [
  { id: 'all', label: 'Campanha toda', range: () => [first, last] },
  { id: 'last', label: 'Último dia', range: () => [last, last] },
  { id: 'week', label: 'Últimos 7 dias', range: () => [GEO_DAYS[Math.max(GEO_DAYS.length - 6, 0)], last] },
];

function Card({ title, value, sub, tone = 'text-white' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-extrabold mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function CityTable({ rows, mrrTotal }) {
  const th = 'py-3 px-3 text-right';
  const td = 'py-2.5 px-3 text-right whitespace-nowrap';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs sm:text-sm text-slate-300">
        <thead className="bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="py-3 px-3">Cidade</th>
            <th className={th}>Vendas novas</th>
            <th className={th}>% meta</th>
            <th className={th}>Migrações</th>
            <th className={`${th} text-emerald-400/80`}>↑ Upgrade</th>
            <th className={`${th} text-red-400/80`}>↓ Downgrade</th>
            <th className={th}>= Igual</th>
            <th className={th}>Sem ref.</th>
            <th className={th}>Cancelados</th>
            <th className={th}>MRR cancelado</th>
            <th className={th}>Novas em risco*</th>
            <th className={th}>Δ MRR migr.</th>
            <th className={`${th} text-sky-300`}>MRR**</th>
            <th className={th}>% MRR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-slate-800/40 transition">
              <td className="py-2.5 px-3 font-medium text-slate-100 whitespace-nowrap">{r.key}</td>
              <td className={`${td} font-bold text-emerald-400`}>{r.novo}</td>
              <td className={td}>{pct(r.shareMeta)}</td>
              <td className={`${td} text-violet-300`}>{r.migrado}</td>
              <td className={`${td} text-emerald-300`}>{r.upgrade || '—'}</td>
              <td className={`${td} text-red-300`}>{r.downgrade || '—'}</td>
              <td className={td}>{r.igual || '—'}</td>
              <td className={`${td} text-slate-500`}>{r.semRef || '—'}</td>
              <td className={`${td} ${r.cancelados ? 'text-red-300' : 'text-slate-500'}`}>{r.cancelados || '—'}</td>
              <td className={`${td} text-red-300/80`}>{r.mrrCancelado ? brl(r.mrrCancelado) : '—'}</td>
              <td className={`${td} ${riskClass(r.novoRisco, r.novo)}`}>
                {r.novo ? `${r.novoCancelado + r.novoNaoAceito} (${pct(r.novoRisco, 0)})` : '—'}
              </td>
              <td className={`${td} ${r.deltaMrr > 0 ? 'text-emerald-300' : r.deltaMrr < 0 ? 'text-red-300' : 'text-slate-500'}`}>
                {r.deltaMrr ? signedBrl(r.deltaMrr) : '—'}
              </td>
              <td className={`${td} font-semibold text-sky-300`}>{brl(r.mrr)}</td>
              <td className={`${td} text-slate-400`}>{pct(mrrTotal ? (r.mrr / mrrTotal) * 100 : null)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-950 font-bold text-white border-t border-slate-700">
            <td className="py-3 px-3 text-indigo-300">TOTAL</td>
            <td className={`${td} text-emerald-400`}>{sumRows(rows, 'novo')}</td>
            <td className={td}>{pct((sumRows(rows, 'novo') / GENERAL_STATS.targetGoal) * 100)}</td>
            <td className={`${td} text-violet-300`}>{sumRows(rows, 'migrado')}</td>
            <td className={`${td} text-emerald-300`}>{sumRows(rows, 'upgrade')}</td>
            <td className={`${td} text-red-300`}>{sumRows(rows, 'downgrade')}</td>
            <td className={td}>{sumRows(rows, 'igual')}</td>
            <td className={`${td} text-slate-400`}>{sumRows(rows, 'semRef')}</td>
            <td className={`${td} text-red-300`}>{sumRows(rows, 'cancelados')}</td>
            <td className={`${td} text-red-300`}>{brl(sumRows(rows, 'mrrCancelado'))}</td>
            <td className={`${td} text-amber-300`}>{sumRows(rows, 'novoCancelado') + sumRows(rows, 'novoNaoAceito')}</td>
            <td className={td}>{signedBrl(sumRows(rows, 'deltaMrr'))}</td>
            <td className={`${td} text-sky-300`}>{brl(mrrTotal)}</td>
            <td className={td}>100,0%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function Cities() {
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);

  const isAll = from === first && to === last;
  // Campanha toda: sem filtro, para incluir registros sem data de cadastro.
  const rows = useMemo(() => (isAll ? aggregateCities() : aggregateCities(from, to)), [from, to, isAll]);
  const t = (k) => sumRows(rows, k);
  const mrrTotal = t('mrr');
  const comRef = t('upgrade') + t('downgrade') + t('igual');
  const top = rows.filter((c) => c.total > 0).slice(0, 12);
  const critical = rows.filter((c) => c.novo >= 5 && c.novoRisco >= 30);
  const periodLabel = from === to ? dayLabel(from) : `${dayLabel(from)} a ${dayLabel(to)}`;

  const pick = (setter, other, isFrom) => (e) => {
    const v = e.target.value;
    setter(v);
    if (isFrom && v > other) setTo(v);
    if (!isFrom && v < other) setFrom(v);
  };

  return (
    <div className="space-y-6">
      {/* FILTRO DE DIAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white shrink-0">
          <CalendarRange className="w-4 h-4 text-indigo-400" />
          <span>Período (data de cadastro)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const [a, b] = p.range();
            const active = from === a && to === b;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setFrom(a);
                  setTo(b);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  active ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 lg:ml-auto">
          <label className="flex items-center gap-1.5">
            De
            <select value={from} onChange={pick(setFrom, to, true)} className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-slate-100">
              {GEO_DAYS.map((d) => (
                <option key={d} value={d}>{dayLabel(d)}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Até
            <select value={to} onChange={pick(setTo, from, false)} className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-slate-100">
              {GEO_DAYS.map((d) => (
                <option key={d} value={d}>{dayLabel(d)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* CARDS DO PERÍODO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="MRR ativo no período"
          value={brl0(mrrTotal)}
          tone="text-sky-300"
          sub={`Novas ${brl0(t('mrrNovo'))} · Migrações ${brl0(t('mrrMig'))}`}
        />
        <Card
          title="Vendas novas"
          value={fmt(t('novo'))}
          tone="text-emerald-400"
          sub={`${pct((t('novo') / GENERAL_STATS.targetGoal) * 100)} da meta ${GENERAL_STATS.targetGoal}`}
        />
        <Card
          title="Migrações"
          value={fmt(t('migrado'))}
          tone="text-violet-300"
          sub={`↑ ${t('upgrade')} upgrade · ↓ ${t('downgrade')} downgrade · ${t('semRef')} sem ref.`}
        />
        <Card
          title="Cancelados"
          value={fmt(t('cancelados'))}
          tone="text-red-400"
          sub={`${brl0(t('mrrCancelado'))}/mês fora do MRR`}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">MRR ativo por cidade: Vendas Novas vs. Migrações</h3>
            <p className="text-xs text-slate-400">12 maiores cidades em MRR · {periodLabel}</p>
          </div>
          <MapPin className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${fmt(v / 1000, 0)} mil`} />
              <YAxis dataKey="key" type="category" stroke="#cbd5e1" fontSize={10} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [brl(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="mrrNovo" name="MRR vendas novas" stackId="a" fill="#10b981" />
              <Bar dataKey="mrrMig" name="MRR migrações" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4">
          <h3 className="text-base font-semibold text-white">Detalhamento por Cidade</h3>
          <p className="text-xs text-slate-400">
            {periodLabel}
            {isAll ? '' : ' (filtrado)'} · ordenado por MRR
          </p>
        </div>

        <CityTable rows={rows} mrrTotal={mrrTotal} />

        <div className="mt-4 space-y-1.5 text-[11px] text-slate-400">
          <p>* Em risco = vendas novas canceladas + com contrato não aceito. Cor só a partir de 5 vendas (amostra pequena).</p>
          <p>
            ** MRR = soma das mensalidades (com SVA) dos contratos não cancelados, vendas novas + migrações. Inclui contratos
            ainda sem aceite ou aguardando instalação.
          </p>
          <p>
            Upgrade/downgrade: valor do plano migrado comparado ao plano anterior (diferença acima de R$ 0,50). Δ MRR migr. soma
            essa diferença nas migrações não canceladas.{' '}
            <span className="text-amber-300/90">
              Cobertura: {comRef} de {t('migrado')} migrações ({pct(t('migrado') ? (comRef / t('migrado')) * 100 : null)}) têm
              plano anterior na base de referência
              {BASE_REF.arquivo ? ` (${BASE_REF.clientes} clientes abaixo de 300 Mbps)` : ' (nenhuma base carregada)'}. As demais
              aparecem como "Sem ref.".
            </span>
          </p>
          {critical.length > 0 && (
            <p className="text-red-300/90">
              Risco alto (≥30%, com 5+ vendas): {critical.map((c) => `${c.key} (${c.novoCancelado + c.novoNaoAceito} de ${c.novo})`).join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
