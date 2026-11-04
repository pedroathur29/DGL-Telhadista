#!/bin/sh
# Mostra o sha256 do <script> inline do index.html, para conferir com a Content-Security-Policy.
python3 - <<'PY'
import re, hashlib, base64
h = open('index.html', encoding='utf-8').read()
s = re.search(r'<script>([\s\S]*?)</script>', h).group(1)
calc = base64.b64encode(hashlib.sha256(s.encode()).digest()).decode()
ok = f"'sha256-{calc}'" in h
print('sha256-' + calc, '(confere com a CSP)' if ok else '(NÃO confere: atualize a CSP no index.html)')
raise SystemExit(0 if ok else 1)
PY
