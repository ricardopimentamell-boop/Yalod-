# Dashboard Mell Internet — Vendas & Migrações

Campanha 26/10 a 05/12/2026. Base: export Hubsoft (26/10 a 04/11/2026, 12h).

- **Abrir sem instalar nada:** `dist/index.html` (arquivo único, funciona offline).
- **Desenvolver:** `npm install && npm run dev`. **Gerar o HTML:** `npm run build`.

## Atualizar com um novo export

```
scripts/update.sh relatorio-de-servicos-do-clien-AAAAMMDDHHMMSS.xlsx
```

Gera `src/export.json` (só agregados) e `dist/index.html`. A data/hora de corte sai do
carimbo no nome do arquivo. O script para com erro se o export vier sem as colunas
esperadas ou com totais que não fecham. Não versione o .xlsx: ele tem CPF, telefone e
endereço dos clientes.

## Onde mexer

- `src/data.js` — parâmetros manuais (meta, consultores, horário comercial, calendário, feriados). O resto vem do export.
- `src/metrics.js` — tudo que é derivado: dias úteis, ritmo, projeção, folga, percentuais.
- `src/App.jsx` — layout.

## Premissas

- Dias úteis = seg a sáb, exceto feriados 02/11, 15/11 (domingo) e 20/11 → 34 dias; 7,5 decorridos.
- Ritmo = 192 vendas ÷ 7,5 dias ÷ 39 consultores = 0,656/consultor/dia, aplicado a 38 consultores.
- Projeção linear (ritmo constante). O cenário com perda aplica o % sobre o total bruto.
