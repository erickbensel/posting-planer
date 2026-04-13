#!/bin/bash

cd "$(dirname "$0")"

clear
echo ""
echo "  ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗"
echo "  ██╔══██╗██╔════╝████╗  ██║██╔════╝██╔════╝██║"
echo "  ██████╔╝█████╗  ██╔██╗ ██║███████╗█████╗  ██║"
echo "  ██╔══██╗██╔══╝  ██║╚██╗██║╚════██║██╔══╝  ██║"
echo "  ██████╔╝███████╗██║ ╚████║███████║███████╗███████╗"
echo "  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝"
echo ""
echo "  Posting Planer — Bensel Media"
echo "  ────────────────────────────────────────"
echo ""

# Prüfen ob Port 3000 schon belegt
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "  ⚠️  Port 3000 ist bereits belegt — alten Prozess stoppen..."
  kill $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null
  sleep 1
fi

echo "  ▶  Server wird gestartet..."
npm run dev &
DEV_PID=$!

# Warten bis bereit
printf "  ⏳ Warte"
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    break
  fi
  printf "."
  sleep 1
done

echo ""
echo ""
echo "  ✅ App läuft!  →  http://localhost:3000"
echo ""
echo "  ────────────────────────────────────────"
echo "  Login:"
echo "    E-Mail:   kontakt@erickbensel.de"
echo "    Passwort: erick2101"
echo "  ────────────────────────────────────────"
echo ""
echo "  Fenster offen lassen — Strg+C zum Beenden"
echo ""

# Browser öffnen
open http://localhost:3000

# Claude Code in neuem Terminal-Fenster starten
PROJECT_DIR="$(pwd)"
osascript <<EOF
tell application "Terminal"
  do script "cd \"$PROJECT_DIR\" && claude"
  activate
end tell
EOF

wait $DEV_PID
