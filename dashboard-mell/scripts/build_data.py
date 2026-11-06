"""Gera src/export.json a partir do export Hubsoft (Relatório de Serviços).

Uso: python3 scripts/build_data.py caminho/do/relatorio.xlsx

Só agregados vão para o JSON: nenhum nome, CPF, telefone ou endereço.
O .xlsx bruto não deve ser versionado (tem dados pessoais).
Sai com erro (código 1) se o arquivo não tiver a estrutura esperada,
para a rotina diária não publicar dados quebrados.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

OUT = Path(__file__).resolve().parent.parent / "src" / "export.json"
CAMPAIGN_START = "2026-10-26"
START_TOLERANCE = "2026-10-27"  # primeiro cadastro deve cair até aqui
REQUIRED = ["origem", "valor", "valor_com_pacote", "servico_status", "situacao_contrato", "cidade", "data_cadastro"]

# Faixas de preço das migrações (valor com pacote).
PRICE_BUCKETS = [
    ("R$ 79,90 (Combo 300M)", lambda v: v == 79.90),
    ("R$ 99,90 (600M)", lambda v: v == 99.90),
    ("R$ 109,90 - 124,90 (Giga)", lambda v: 109.90 <= v <= 124.90),
]


def fail(msg):
    print(f"ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def num(s):
    return pd.to_numeric(s.str.replace(".", "", regex=False).str.replace(",", "."), errors="coerce").fillna(0)


def cutoff_from(path, cadastro):
    """Data/hora do corte: carimbo no nome do arquivo (…20261104120724…) ou último cadastro."""
    m = re.search(r"(20\d{12})", Path(path).name)
    if m:
        return datetime.strptime(m.group(1), "%Y%m%d%H%M%S")
    return cadastro.max().to_pydatetime()


def main(path):
    raw = pd.read_excel(path, dtype=str)
    missing = [c for c in REQUIRED if c not in raw.columns]
    if missing:
        fail(f"colunas ausentes no export: {missing}")

    d = raw[raw.origem.isin(["novo", "migrado"])].copy()  # remove a linha de totais
    if d.empty:
        fail("nenhum registro com origem novo/migrado")

    d["valor_c"] = num(d.valor_com_pacote)
    d["valor_s"] = num(d.valor)
    cad = pd.to_datetime(d.data_cadastro, format="%d/%m/%Y %H:%M", errors="coerce")
    d["dia"] = cad.dt.strftime("%Y-%m-%d")
    d["cidade"] = d.cidade.fillna("-").str.strip().str.upper()
    st = d.servico_status.fillna("-").str.replace(" (não usar)", "", regex=False)
    ct = d.situacao_contrato.fillna("-")
    d["cancelado"] = st.eq("Cancelado")
    d["aguard_inst"] = st.eq("Aguardando Instalação")
    d["aguard_mig"] = st.eq("Aguardando Migração")
    d["habilitado"] = st.eq("Serviço Habilitado")
    d["aceito"] = ct.eq("Contrato Aceito")
    d["nao_aceito"] = ct.eq("Contrato Não Aceito")
    d["sem_contrato"] = ~(d.aceito | d.nao_aceito)

    cutoff = cutoff_from(path, cad)
    flags = ["cancelado", "aguard_inst", "aguard_mig", "habilitado", "aceito", "nao_aceito", "sem_contrato"]

    rows = []
    for (cidade, origem), g in d.groupby(["cidade", "origem"]):
        r = {"cidade": cidade, "origem": origem, "qtd": len(g),
             "receita": round(g.valor_c.sum(), 2), "receita_sem_sva": round(g.valor_s.sum(), 2)}
        r.update({f: int(g[f].sum()) for f in flags})
        rows.append(r)

    def totals(g):
        return {"qtd": len(g), "receita": round(g.valor_c.sum(), 2), "receita_sem_sva": round(g.valor_s.sum(), 2)}

    mig = d[d.origem == "migrado"].valor_c
    buckets = [{"range": name, "count": int(mig.map(test).sum())} for name, test in PRICE_BUCKETS]
    buckets.append({"range": "Outros / Customizados", "count": len(mig) - sum(b["count"] for b in buckets)})

    # O export precisa cobrir a campanha inteira (filtro de data do Hubsoft desde o início).
    first_day = d.loc[d.dia >= "2000-01-01", "dia"].min()
    if first_day is None or first_day > START_TOLERANCE:
        fail(f"export começa em {first_day}, mas a campanha começa em {CAMPAIGN_START}. "
             "Exporte de novo com o período desde o início da campanha.")

    cutoff_day = cutoff.strftime("%Y-%m-%d")
    novo = d[(d.origem == "novo") & d.dia.between(CAMPAIGN_START, cutoff_day)]
    daily = novo.groupby("dia").size().sort_index()

    out = {
        "fonte": Path(path).name,
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "corte": cutoff.isoformat(timespec="minutes"),
        "registros": len(d),
        "totais": {"geral": totals(d), "novo": totals(d[d.origem == "novo"]), "migrado": totals(d[d.origem == "migrado"])},
        "faixas_migracao": buckets,
        "status_servico": st.value_counts().to_dict(),
        "status_contrato": {
            "Aceito": int(d.aceito.sum()),
            "Não Aceito": int(d.nao_aceito.sum()),
            "Sem Contrato": int(d.sem_contrato.sum()),
        },
        "por_cidade_origem": rows,
        "vendas_novas_por_dia": [{"date": k, "qtd": int(v)} for k, v in daily.items()],
    }

    # Conferências básicas antes de gravar.
    t = out["totais"]
    if t["novo"]["qtd"] + t["migrado"]["qtd"] != t["geral"]["qtd"]:
        fail("novo + migrado não fecha com o total")
    if sum(out["status_servico"].values()) != len(d) or sum(out["status_contrato"].values()) != len(d):
        fail("status não fecham com o total")

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"OK {OUT.name}: corte {out['corte']}, {len(d)} registros, "
          f"{t['novo']['qtd']} vendas novas, {t['migrado']['qtd']} migrações, {len(daily)} dias")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        fail("uso: python3 scripts/build_data.py relatorio.xlsx")
    main(sys.argv[1])
