import React, { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { PERIOD_ANALYSIS, analyzeRange } from './metrics.js';
import { GENERAL_STATS, CAMPAIGN_START, CAMPAIGN_END } from './data.js';

const fmt = (v, d = 0) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const signed = (n) => (n >= 0 ? `+${fmt(n)}` : fmt(n));
const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const { rows, global } = PERIOD_ANALYSIS;
const OPTIONS = [global, ...rows];

function Stat({ label, value, sub, tone = 'text-white' }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function PeriodGoals() {
  const [sel, setSel] = useState('all');
  const [cFrom, setCFrom] = useState(rows[0].start);
  const [cTo, setCTo] = useState(rows[rows.length - 1].end);
  const custom = useMemo(
    () => ({ ...analyzeRange({ id: 'custom', label: 'Personalizado', start: cFrom, end: cTo }) }),
    [cFrom, cTo],
  );
  const p = sel === 'custom' ? custom : OPTIONS.find((o) => o.id === sel);
  const ok = p.diff >= 0;
  const pickDate = (setter, isFrom) => (e) => {
    const v = e.target.value;
    if (!v || v < CAMPAIGN_START || v > CAMPAIGN_END) return;
    setter(v);
    if (isFrom && v > cTo) setCTo(v);
    if (!isFrom && v < cFrom) setCFrom(v);
    setSel('custom');
  };
  const td = 'px-3 py-2 whitespace-nowrap';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Meta por Período</h3>
            <p className="text-xs text-slate-400">
              Meta global de {GENERAL_STATS.targetGoal} ({dm(global.start)} a {dm(global.end)}), validada fase a fase. Corte em{' '}
              {GENERAL_STATS.cutoffLabel}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setSel(o.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                sel === o.id
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {o.id === 'all' ? 'Campanha toda' : o.label} · {dm(o.start)}–{dm(o.end)}
            </button>
          ))}
          <button
            onClick={() => setSel('custom')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
              sel === 'custom'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
        <span className="font-semibold text-slate-300">Período livre:</span>
        <label className="flex items-center gap-1.5">
          De
          <input
            type="date"
            value={cFrom}
            min={CAMPAIGN_START}
            max={CAMPAIGN_END}
            onChange={pickDate(setCFrom, true)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-100 [color-scheme:dark]"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Até
          <input
            type="date"
            value={cTo}
            min={CAMPAIGN_START}
            max={CAMPAIGN_END}
            onChange={pickDate(setCTo, false)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-100 [color-scheme:dark]"
          />
        </label>
        <span>
          Meta proporcional = {GENERAL_STATS.targetGoal} × {custom.days.total} dias úteis ÷ {global.days.total} ={' '}
          <b className="text-slate-200">{fmt(custom.goalExact, 1)}</b>
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat
          label={p.id === 'all' ? 'Meta global' : 'Meta proporcional do período'}
          value={fmt(p.goal)}
          sub={`${p.days.total} dias úteis (${p.days.weekdays} seg-sex + ${p.days.saturdays} sáb)`}
        />
        <Stat label="Realizado" value={fmt(p.realized)} sub={`${p.goal ? fmt((p.realized / p.goal) * 100, 1) : '—'}% da meta · ${p.status}`} tone="text-emerald-400" />
        <Stat label="Média realizada" value={fmt(p.avgDaily, 1)} sub={`vendas/dia útil em ${fmt(p.elapsed, 1)} dias`} tone="text-sky-300" />
        <Stat
          label="Necessário"
          value={fmt(p.required, 1)}
          sub={p.remainingDays > 0 ? `vendas/dia nos ${fmt(p.remainingDays, 1)} dias restantes` : 'período encerrado'}
          tone="text-indigo-300"
        />
        <Stat
          label="Projeção"
          value={fmt(p.projection)}
          sub={`${signed(p.diff)} vs meta (${p.goal ? fmt(p.rate, 1) : '—'}%)`}
          tone={ok ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className={td}>Período</th>
              <th className={td}>Dias úteis</th>
              <th className={td}>Meta</th>
              <th className={td}>Realizado</th>
              <th className={td}>Média/dia</th>
              <th className={td}>Necessário/dia</th>
              <th className={td}>Ritmo da projeção</th>
              <th className={td}>Projeção</th>
              <th className={td}>Folga</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-800/60">
                <td className={td}>
                  <span className="font-medium text-white">{r.label}</span>
                  <span className="text-xs text-slate-500"> {dm(r.start)}–{dm(r.end)} · {r.status}</span>
                </td>
                <td className={td}>{r.days.total}</td>
                <td className={td}>{fmt(r.goal)}</td>
                <td className={td}>{fmt(r.realized)}</td>
                <td className={td}>{fmt(r.avgDaily, 1)}</td>
                <td className={td}>{fmt(r.required, 1)}</td>
                <td className={`${td} text-xs text-slate-400`}>
                  {fmt(r.wPace, 1)} seg-sex / {fmt(r.sPace, 1)} sáb ({r.paceSource})
                </td>
                <td className={td}>{fmt(r.projection)}</td>
                <td className={`${td} font-semibold ${r.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{signed(r.diff)}</td>
              </tr>
            ))}
            {sel === 'custom' && (
              <tr className="border-b border-slate-800/60 bg-indigo-950/30">
                <td className={td}>
                  <span className="font-medium text-indigo-200">Personalizado</span>
                  <span className="text-xs text-slate-500"> {dm(custom.start)}–{dm(custom.end)} · {custom.status}</span>
                </td>
                <td className={td}>{custom.days.total}</td>
                <td className={td}>{fmt(custom.goal)}</td>
                <td className={td}>{fmt(custom.realized)}</td>
                <td className={td}>{fmt(custom.avgDaily, 1)}</td>
                <td className={td}>{fmt(custom.required, 1)}</td>
                <td className={`${td} text-xs text-slate-400`}>
                  {fmt(custom.wPace, 1)} seg-sex / {fmt(custom.sPace, 1)} sáb ({custom.paceSource})
                </td>
                <td className={td}>{fmt(custom.projection)}</td>
                <td className={`${td} font-semibold ${custom.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{signed(custom.diff)}</td>
              </tr>
            )}
            <tr className="bg-slate-950/60 font-semibold">
              <td className={td}>Total (meta global)</td>
              <td className={td}>{global.days.total}</td>
              <td className={td}>{fmt(global.goal)}</td>
              <td className={td}>{fmt(global.realized)}</td>
              <td className={td}>{fmt(global.avgDaily, 1)}</td>
              <td className={td}>{fmt(global.required, 1)}</td>
              <td className={`${td} text-xs text-slate-400`}>soma das fases</td>
              <td className={td}>{fmt(global.projection)}</td>
              <td className={`${td} ${global.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{signed(global.diff)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Meta da fase (ou do período livre) = {GENERAL_STATS.targetGoal} × (dias úteis do período ÷ dias úteis da campanha). A projeção usa o
        ritmo seg-sex e de sábado do próprio período quando ele já tem 3+ dias completos; antes disso, usa a média da campanha. O ritmo
        é ajustado para {GENERAL_STATS.currentConsultants} consultores. A projeção global é a soma das fases, e a folga de uma fase
        compensa a da outra.
      </p>
    </div>
  );
}
