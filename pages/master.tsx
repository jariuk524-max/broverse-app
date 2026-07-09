import { useState, useEffect, useRef } from "react";
import { getSupabase, isSupabasePaused, Order } from "@/lib/supabase";

const STATUS_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: "Новый", color: "#007AFF", bg: "bg-[#007AFF]/10 text-[#007AFF]" },
  new: { text: "Новый", color: "#007AFF", bg: "bg-[#007AFF]/10 text-[#007AFF]" },
  accepted: { text: "В работе", color: "#FF9500", bg: "bg-[#FF9500]/10 text-[#FF9500]" },
  completed: { text: "Выполнен", color: "#34C759", bg: "bg-[#34C759]/10 text-[#34C759]" },
  cancelled: { text: "Отменён", color: "#FF3B30", bg: "bg-[#FF3B30]/10 text-[#FF3B30]" },
};

export default function MasterPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paused, setPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const leafletMapRef = useRef<L.Map | null>(null);
  const initMapRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    let cancelled = false;

    async function init() {
      try {
        const supabase = getSupabase();
        const { data: existing, error: fetchError } = await supabase
          .from("orders").select("*").order("created_at", { ascending: false });
        if (fetchError) throw fetchError;
        if (!cancelled) { setOrders(existing || []); setConnectionStatus("connected"); }

        channel = supabase.channel("orders-realtime")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
            setOrders((prev) => [payload.new as Order, ...prev]);
          })
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
            const updated = payload.new as Order;
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          })
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" }, (payload) => {
            const deleted = payload.old as Order;
            setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          })
          .subscribe();
      } catch (err) {
        if (cancelled) return;
        if (isSupabasePaused(err)) setPaused(true);
        console.error("Supabase init error:", err);
        setConnectionStatus("error");
      }
    }
    init();
    return () => { cancelled = true; if (channel) channel?.unsubscribe?.(); };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !mapRef.current || initMapRef.current) return;
    initMapRef.current = true;
    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;
      const map = L.map(mapRef.current!, { center: [55.75, 37.62], zoom: 11, zoomControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB © OSM",
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      leafletMapRef.current = map;
      orders.forEach((order) => addMarker(L, map, order));
    });
  }, [mounted]);

  useEffect(() => {
    if (!leafletMapRef.current || !mounted) return;
    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;
      const seenIds = new Set(orders.map((o) => o.id));
      markersRef.current.forEach((marker, id) => {
        if (!seenIds.has(id)) { map.removeLayer(marker); markersRef.current.delete(id); }
      });
      orders.forEach((order) => {
        if (!markersRef.current.has(order.id)) addMarker(L, map, order);
      });
    });
  }, [orders, mounted]);

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    } catch (err) { console.error("Update status error:", err); }
  }

  function addMarker(L: typeof import("leaflet"), map: L.Map, order: Order) {
    if (order.lat == null || order.lng == null) return;
    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.new;
    const icon = L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="padding:6px 10px;border-radius:20px;background:${statusInfo.color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px ${statusInfo.color}66;border:2px solid white;">
          <span style="font-size:11px;font-weight:700;color:white;white-space:nowrap;">${order.service_name}</span>
        </div>
        <div style="width:2px;height:6px;background:${statusInfo.color};opacity:0.5;"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:${statusInfo.color};opacity:0.3;"></div>
      </div>`,
      iconSize: [60, 40],
      iconAnchor: [30, 40],
    });
    const marker = L.marker([order.lat, order.lng], { icon }).addTo(map)
      .bindPopup(`<div style="font-family:-apple-system,sans-serif;min-width:180px;padding:2px;">
        <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#1C1C1E;">${order.service_name}</p>
        <p style="font-size:11px;color:#8E8E93;margin:0 0 4px;">${order.client_name || ""} · ${order.client_phone || ""}</p>
        <p style="font-size:11px;color:#8E8E93;margin:0 0 4px;">${order.address}</p>
        ${((order.metadata as any)?.description) ? `<p style="font-size:11px;color:#C7C7CC;margin:0 0 4px;">${String((order.metadata as any).description)}</p>` : ""}
        <p style="font-size:10px;color:${statusInfo.color};font-weight:600;margin:4px 0 0;">${statusInfo.text}</p>
      </div>`);
    markersRef.current.set(order.id, marker);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#007AFF]" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "new" || o.status === "accepted");

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F7] font-['-apple-system',sans-serif] text-[#1C1C1E]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-black/[0.06] bg-white/70 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold uppercase tracking-wide">BroVerse</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">Кабинет мастера</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-[#34C759]" : connectionStatus === "connecting" ? "bg-[#FF9500]" : "bg-[#FF3B30]"}`} />
          <span className="text-[11px] text-[#8E8E93]">
            {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Подключение..." : "Ошибка"}
          </span>
        </div>
      </header>

      {paused && (
        <div className="border-b border-[#FF3B30]/20 bg-[#FF3B30]/8 px-5 py-3">
          <p className="text-[13px] font-semibold text-[#FF3B30]">⚠ Проект Supabase приостановлен. Разархивируйте его в Dashboard.</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div ref={mapRef} className="flex-1" />

        {/* Orders Panel */}
        <div className="flex w-[360px] flex-col overflow-hidden border-l border-black/[0.06]">
          <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/50 px-5 py-4 backdrop-blur-xl">
            <h2 className="text-[16px] font-bold">Заказы</h2>
            <span className="rounded-full bg-[#007AFF]/10 px-3 py-1 text-[11px] font-semibold text-[#007AFF]">{activeOrders.length} активных</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-white/30 p-2">
            {orders.length === 0 && (
              <div className="py-12 text-center text-[#C7C7CC]">
                <p className="mb-2 text-[28px]">📡</p>
                <p className="text-[14px] font-semibold">Ожидание заказов...</p>
                <p className="mt-1 text-[12px]">Новый заказ появится здесь автоматически</p>
              </div>
            )}

            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.new;
              return (
                <div
                  key={order.id}
                  className="mb-2 overflow-hidden rounded-[16px] border border-white/60 bg-white/50 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold">{order.service_name}</p>
                      <p className="mt-0.5 text-[12px] text-[#8E8E93]">{order.client_name}</p>
                    </div>
                    <span className={`shrink-0 ml-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusInfo.bg}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="mb-2 space-y-0.5 text-[12px] text-[#8E8E93]">
                    <p>📞 {order.client_phone}</p>
                    <p>📍 {order.address}</p>
                    {((order.metadata as any)?.description) && (
                      <p className="mt-1 text-[11px] text-[#C7C7CC]">{String((order.metadata as any).description)}</p>
                    )}
                  </div>

                  <div className="mb-3 text-[10px] text-[#C7C7CC]">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </div>

                  {(order.status === "pending" || order.status === "new") && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "accepted")}
                        className="flex-1 rounded-[10px] bg-[#34C759] py-2 text-[12px] font-bold text-white active:scale-95 transition-transform"
                      >Принять</button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className="flex-1 rounded-[10px] border border-[#FF3B30]/20 bg-[#FF3B30]/8 py-2 text-[12px] font-bold text-[#FF3B30] active:scale-95 transition-transform"
                      >Отклонить</button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      className="w-full rounded-[10px] bg-[#34C759] py-2 text-[12px] font-bold text-white active:scale-95 transition-transform"
                    >Выполнено ✓</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
