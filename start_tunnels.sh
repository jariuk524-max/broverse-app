#!/bin/bash
# BroVerse Tunnel Starter (Pinggy)
# Usage: ./start_tunnels.sh

echo "🔧 BroVerse — запуск Pinggy туннелей..."

# Kill old processes
echo "→ Очистка старых процессов..."
pkill -9 ngrok 2>/dev/null
pkill -9 cloudflared 2>/dev/null
sleep 1

# Backend on port 3000
BACKEND_PORT=3000
# Socket on port 3001
SOCKET_PORT=3001

echo "→ Запуск Pinggy туннеля на порт $BACKEND_PORT..."

# Check if pinggy is available
if ! command -v pinggy &> /dev/null; then
  echo "⚠️  Pinggy CLI не найден. Установите:"
  echo "   npm install -g pinggy"
  echo ""
  echo "   Или запустите вручную:"
  echo "   pinggy -p $BACKEND_PORT"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ГОТОВО — запустите Pinggy:"
echo "═══════════════════════════════════════════"
echo ""
echo "  Backend (порт $BACKEND_PORT):"
echo "  pinggy -p $BACKEND_PORT"
echo ""
echo "  Или через curl (без CLI):"
echo "  curl -s https://api.pinggy.com/token 2>/dev/null || echo 'Настройте Pinggy вручную'"
echo ""
echo "  Вставьте полученную ссылку в конфиг:"
echo "  NEXT_PUBLIC_API_URL=<ваша-ссылка-pinggy>"
echo ""
echo "═══════════════════════════════════════════"
echo ""
echo "  Обновить бота автоматически:"
echo ""
echo "  BOT_TOKEN=\"8562980880:AAGMQSOSZs5h0cov30NJ6hbt0KyKTdqov7w\""
echo ""
echo '  curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \'
echo '    -H "Content-Type: application/json" \'
echo "    -d '{\"menu_button\":{\"type\":\"web_app\",\"text\":\"🏠 BroVerse\",\"web_app\":{\"url\":\"<PINGGY_URL>\"}}}'"
echo ""
