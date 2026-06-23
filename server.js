const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const { createClient } = require("@supabase/supabase-js");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;
const SOCKET_PORT = 3001;

async function sendTelegramOrder(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = order.master_chat_id || process.env.NEXT_PUBLIC_MASTER_CHAT_ID;

  if (!token || !chatId) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN or MASTER_CHAT_ID");
    return;
  }

  const time = new Date(order.created_at).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  });

  const desc = order.metadata?.description || "";
  const text = [
    `📦 <b>Новый заказ!</b>`,
    ``,
    `🔧 Услуга: <b>${order.service_name}</b>`,
    `👤 Клиент: ${order.client_name || ""}`,
    `📞 Телефон: ${order.client_phone || ""}`,
    `📍 Адрес: ${order.address || ""}`,
    desc ? `📝 ${desc}` : ``,
    ``,
    `🕐 ${time}`,
    order.lat && order.lng
      ? `🗺 <a href="https://www.google.com/maps?q=${order.lat},${order.lng}">Открыть на карте</a>`
      : ``,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log("[telegram] Sent for order:", order.id);
    } else {
      console.error("[telegram] API error:", data.description);
    }
  } catch (err) {
    console.error("[telegram] Send failed:", err);
  }
}

function startSupabaseRealtime() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[supabase] Missing env vars — Realtime subscription skipped");
    return;
  }

  const supabase = createClient(url, key);

  supabase
    .channel("server-orders")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        console.log("[supabase] New order received:", payload.new.id);
        sendTelegramOrder(payload.new);
      }
    )
    .subscribe((status) => {
      console.log("[supabase] Realtime status:", status);
    });
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  httpServer.listen(PORT, () => {
    console.log(`> Next.js ready on http://localhost:${PORT}`);
  });

  const io = new Server(SOCKET_PORT, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("[socket] client connected:", socket.id);

    socket.on("master:update", (data) => {
      socket.broadcast.emit("master:update", data);
    });

    socket.on("master:remove", (id) => {
      socket.broadcast.emit("master:remove", id);
    });

    socket.on("disconnect", () => {
      console.log("[socket] client disconnected:", socket.id);
    });
  });

  console.log(`> Socket.IO ready on http://localhost:${SOCKET_PORT}`);

  startSupabaseRealtime();
  console.log(`> Supabase Realtime subscription active`);
});
