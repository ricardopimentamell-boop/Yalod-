import React, { useState } from 'react';
import { MapPin, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { GENERAL_STATS } from './data.js';
import { CITY_ROWS, REGIONAL_ROWS, UNMAPPED_CITIES, NEW_SALES_RISK } from './metrics.js';

const fmt = (v, d = 0) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const brl = (v) => (v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v));
const pct = (v, d = 1) => (v == null ? '—' : `${fmt(v, d)}%`);
const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' };

// Risco das vendas novas da cidade = (canceladas + sem aceite) / vendas novas.
const riskClass = (v, n) => {
  if (v == null || n < 5) return 'text-slate-500';
  if (v >= 30) return 'text-red-400 font-semibold';
  if (v >= 15) return 'text-amber-300';
  return 'text-emerald-400';
};

function GeoTable({ rows, showRegional }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs sm:text-sm text-slate-300">
        <thead className="bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="py-3 px-3">{showRegional ? 'Cidade' : 'Regional'}</th>
            {showRegional && <th className="py-3 px-3">Regional</th>}
            {!showRegional && <th className="py-3 px-3 text-right">Cidades</th>}
            <th className="py-3 px-3 text-right">Vendas novas</th>
            <th className="py-3 px-3 text-right">% da meta</th>
            <th className="py-3 px-3 text-right">Migrações</th>
            <th className="py-3 px-3 text-right">Receita total</th>
            <th className="py-3 px-3 text-right">Ticket novas</th>
            <th className="py-3 px-3 text-right">Novas aguard. instal.</th>
            <th className="py-3 px-3 text-right">Novas em risco*</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-slate-800/40 transition">
              <td className="py-2.5 px-3 font-medium text-slate-100 whitespace-nowrap">{r.key}</td>
              {showRegional && (
                <td className={`py-2.5 px-3 whitespace-nowrap ${r.regional === 'Salinas' ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {r.regional}
                </td>
              )}
              {!showRegional && <td className="py-2.5 px-3 text-right">{r.nCidades}</td>}
              <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{r.novo}</td>
              <td className="py-2.5 px-3 text-right">{pct(r.shareMeta)}</td>
              <td className="py-2.5 px-3 text-right text-violet-300">{r.migrado}</td>
              <td className="py-2.5 px-3 text-right">{brl(r.receita)}</td>
              <td className="py-2.5 px-3 text-right">{brl(r.ticketNovo)}</td>
              <td className="py-2.5 px-3 text-right">{r.novoAguardInst}</td>
              <td className={`py-2.5 px-3 text-right whitespace-nowrap ${riskClass(r.novoRisco, r.novo)}`}>
                {r.novo ? `${r.novoCancelado + r.novoNaoAceito} (${pct(r.novoRisco, 0)})` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Regions() {
  const [view, setView] = useState('regional');
  const topCities = CITY_ROWS.filter((c) => c.total > 0).slice(0, 12);
  const salinas = REGIONAL_ROWS.find((r) => r.key === 'Salinas');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Cidades com movimento</p>
          <p className="text-3xl font-extrabold text-white mt-1">{CITY_ROWS.length}</p>
          <p className="text-xs text-slate-400 mt-2">
            {CITY_ROWS.filter((c) => c.novo > 0).length} com venda nova; top 3 somam{' '}
            {pct(CITY_ROWS.slice(0, 3).reduce((s, c) => s + c.shareNovo, 0), 0)} das vendas novas
          </p>
        </div>
        <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-5">
          <p className="text-xs font-semibold text-indigo-300 uppercase">Regional Salinas</p>
          <p className="text-3xl font-extrabold text-white mt-1">
            {salinas?.novo ?? 0} <span className="text-sm font-normal text-slate-400">vendas novas</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {pct(salinas?.shareNovo)} do total · {salinas?.migrado ?? 0} migrações · {brl(salinas?.receita)}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Vendas novas em risco (total)</p>
          <p className="text-3xl font-extrabold text-amber-300 mt-1">{NEW_SALES_RISK.canc + NEW_SALES_RISK.nao}</p>
          <p className="text-xs text-slate-400 mt-2">
            {NEW_SALES_RISK.canc} canceladas ({pct(NEW_SALES_RISK.cancPct)}) + {NEW_SALES_RISK.nao} sem aceite (
            {pct(NEW_SALES_RISK.naoPct)}) de {GENERAL_STATS.newSalesCount}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Top cidades: Vendas Novas vs. Migrações</h3>
            <p className="text-xs text-slate-400">12 cidades com maior volume de vendas novas</p>
          </div>
          <MapPin className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCities} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="key" type="category" stroke="#cbd5e1" fontSize={10} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="novo" name="Vendas novas" stackId="a" fill="#10b981" />
              <Bar dataKey="migrado" name="Migrações" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-white">Detalhamento por {view === 'regional' ? 'Regional' : 'Cidade'}</h3>
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            {[
              ['regional', 'Regional'],
              ['cidade', 'Cidade'],
            ].map(([id, l]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  view === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <GeoTable rows={view === 'regional' ? REGIONAL_ROWS : CITY_ROWS} showRegional={view === 'cidade'} />

        <div className="mt-4 space-y-1.5 text-[11px] text-slate-400">
          <p>* Em risco = vendas novas canceladas + com contrato não aceito. Cor só a partir de 5 vendas (amostra pequena).</p>
          {UNMAPPED_CITIES > 0 && (
            <p className="flex items-start gap-1.5 text-amber-300/90">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>
                {UNMAPPED_CITIES} cidades ainda sem regional definida (só a Regional Salinas está confirmada: Salinas, Taiobeiras, Rio
                Pardo de Minas e Novorizonte). Complete o mapa em <code>src/data.js</code>.
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
