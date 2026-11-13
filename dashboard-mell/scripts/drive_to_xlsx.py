"""Converte o resultado salvo do download do Google Drive (JSON com base64) em .xlsx.

Uso: python3 scripts/drive_to_xlsx.py <arquivo-json-do-download> <pasta-destino>
O download (download_file_content, exportMimeType xlsx) é grande e fica salvo em
tool-results/*.txt; este script grava <titulo>.xlsx preservando o carimbo do nome.
"""
import base64
import json
import sys
from pathlib import Path

src, dest = sys.argv[1], Path(sys.argv[2])
j = json.loads(Path(src).read_text())
name = j["title"] if j["title"].endswith(".xlsx") else j["title"] + ".xlsx"
dest.mkdir(parents=True, exist_ok=True)
(dest / name).write_bytes(base64.b64decode(j["content"]))
print(dest / name)
