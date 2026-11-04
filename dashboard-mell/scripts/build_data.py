"""Gera src/export.json a partir do export Hubsoft (Relatório de Serviços).

Uso: python3 scripts/build_data.py caminho/do/relatorio.xlsx

Só agregados vão para o JSON: nenhum nome, CPF, telefone ou endereço.
O .xlsx bruto não deve ser versionado (tem dados pessoais).
"""
import json
import sys
from pathlib import Path

import pandas as pd

OUT = Path(__file__).resolve().parent.parent / "src" / "export.json"
START, CUTOFF = "2026-10-26", "2026-11-04"


def num(s):
    return pd.to_numeric(s.str.replace(".", "", regex=False).str.replace(",", "."), errors="coerce").fillna(0)


def main(path):
    d = pd.read_excel(path, dtype=str)
    d = d[d.origem.isin(["novo", "migrado"])].copy()  # remove a linha de totais
    d["valor_c"] = num(d.valor_com_pacote)
    d["valor_s"] = num(d.valor)
    d["dia"] = pd.to_datetime(d.data_cadastro.str[:10], format="%d/%m/%Y", errors="coerce").dt.strftime("%Y-%m-%d")
    d["cidade"] = d.cidade.str.strip().str.upper()
    st = d.servico_status.fillna("")
    ct = d.situacao_contrato.fillna("-")
    d["cancelado"] = st.eq("Cancelado")
    d["aguard_inst"] = st.eq("Aguardando Instalação")
    d["aguard_mig"] = st.str.startswith("Aguardando Migração")
    d["habilitado"] = st.eq("Serviço Habilitado")
    d["aceito"] = ct.eq("Contrato Aceito")
    d["nao_aceito"] = ct.eq("Contrato Não Aceito")
    d["sem_contrato"] = ~(d.aceito | d.nao_aceito)

    flags = ["cancelado", "aguard_inst", "aguard_mig", "habilitado", "aceito", "nao_aceito", "sem_contrato"]
    rows = []
    for (cidade, origem), g in d.groupby(["cidade", "origem"]):
        r = {"cidade": cidade, "origem": origem, "qtd": len(g),
             "receita": round(g.valor_c.sum(), 2), "receita_sem_sva": round(g.valor_s.sum(), 2)}
        r.update({f: int(g[f].sum()) for f in flags})
        rows.append(r)

    novo = d[(d.origem == "novo") & d.dia.between(START, CUTOFF)]
    daily = novo.groupby("dia").size().sort_index()
    out = {
        "fonte": Path(path).name,
        "registros": len(d),
        "por_cidade_origem": rows,
        "vendas_novas_por_dia": [{"date": k, "qtd": int(v)} for k, v in daily.items()],
        "status_servico": d.servico_status.str.replace(" (não usar)", "", regex=False).value_counts().to_dict(),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"{OUT}: {len(rows)} linhas cidade/origem, {len(d)} registros, {daily.sum()} vendas novas no período")


if __name__ == "__main__":
    main(sys.argv[1])
