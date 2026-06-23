import type { NextApiRequest, NextApiResponse } from "next";
import { sendTelegramMessage } from "@/lib/telegram";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order } = req.body;
  if (!order || !order.service_name) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const chatId = process.env.NEXT_PUBLIC_MASTER_CHAT_ID;
  if (!chatId) {
    return res.status(400).json({ error: "Master chat_id not configured" });
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

  const sent = await sendTelegramMessage(chatId, text);

  if (!sent) {
    return res.status(500).json({ error: "Failed to send Telegram message" });
  }

  return res.status(200).json({ ok: true });
}
