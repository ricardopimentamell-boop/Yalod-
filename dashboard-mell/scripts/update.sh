#!/usr/bin/env bash
# Atualiza o dashboard a partir de um export do Hubsoft.
# Uso: scripts/update.sh relatorio-de-servicos-...xlsx [base_planos_anteriores.xlsx]
# Gera src/export.json (só agregados) e dist/index.html (arquivo único).
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -ge 1 ] || { echo "uso: scripts/update.sh relatorio.xlsx [base_planos_anteriores.xlsx]" >&2; exit 1; }
python3 -c "import pandas, openpyxl" 2>/dev/null || pip install -q pandas openpyxl
[ -d node_modules ] || npm ci --no-audit --no-fund
python3 -I scripts/build_data.py "$@"
npm run build --silent
echo "OK: dist/index.html pronto"
