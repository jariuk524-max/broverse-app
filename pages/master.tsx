import { useState, useEffect, useRef } from "react";
import { getSupabase, isSupabasePaused, Order } from "@/lib/supabase";

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: "Новый", color: "#f59e0b" },
  new: { text: "Новый", color: "#f59e0b" },
  accepted: { text: "Принят", color: "#3b82f6" },
  completed: { text: "Выполнен", color: "#10b981" },
  cancelled: { text: "Отменён", color: "#ef4444" },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    let cancelled = false;

    async function init() {
      try {
        const supabase = getSupabase();

        const { data: existing, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) {
          setOrders(existing || []);
          setConnectionStatus("connected");
        }

        channel = supabase
          .channel("orders-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "orders" },
            (payload) => {
              const newOrder = payload.new as Order;
              setOrders((prev) => [newOrder, ...prev]);
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "orders" },
            (payload) => {
              const updated = payload.new as Order;
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o))
              );
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "orders" },
            (payload) => {
              const deleted = payload.old as Order;
              setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
            }
          )
          .subscribe();
      } catch (err) {
        if (cancelled) return;
        if (isSupabasePaused(err)) {
          setPaused(true);
        }
        console.error("Supabase init error:", err);
        setConnectionStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (channel) {
        supabaseRemoveChannel(channel);
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !mapRef.current || initMapRef.current) return;
    initMapRef.current = true;

    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [55.75, 37.62],
        zoom: 11,
        zoomControl: false,
      });

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
        if (!seenIds.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      orders.forEach((order) => {
        if (!markersRef.current.has(order.id)) {
          addMarker(L, map, order);
        }
      });
    });
  }, [orders, mounted]);

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    } catch (err) {
      console.error("Update status error:", err);
    }
  }

  function addMarker(L: typeof import("leaflet"), map: L.Map, order: Order) {
    if (order.lat == null || order.lng == null) return;

    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.new;

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:${statusInfo.color};
        display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:900;color:#fff;
        box-shadow:0 2px 12px ${statusInfo.color}66;
        border:3px solid #18181b;
      ">!</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([order.lat, order.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <p style="font-weight:900;font-size:14px;margin:0 0 4px">${order.service_name}</p>
          <p style="font-size:12px;color:#666;margin:0 0 4px">${order.client_name || ""} · ${order.client_phone || ""}</p>
          <p style="font-size:12px;color:#666;margin:0 0 4px">${order.address}</p>
          ${order.metadata?.description ? `<p style="font-size:12px;color:#888;margin:0 0 4px">${order.metadata.description}</p>` : ""}
          <p style="font-size:11px;color:${statusInfo.color};font-weight:700;margin:4px 0 0">${statusInfo.text}</p>
        </div>
      `);

    markersRef.current.set(order.id, marker);
  }

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#71717a" }}>Загрузка...</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "new" || o.status === "accepted");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>BroVerse</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }}>
            Кабинет мастера
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: connectionStatus === "connected" ? "#10b981" : connectionStatus === "connecting" ? "#f59e0b" : "#ef4444",
          }} />
          <span style={{ fontSize: 11, color: "#71717a" }}>
            {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Подключение..." : "Ошибка"}
          </span>
        </div>
      </header>

      {paused && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.15)", borderBottom: "1px solid #ef4444", padding: "10px 24px" }}>
          <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>
            ⚠ Проект Supabase приостановлен. Разархивируйте его в Dashboard для восстановления работы.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div ref={mapRef} style={{ flex: 1, minHeight: 400 }} />

        <div style={{ width: 360, borderLeft: "1px solid #27272a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272a", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 900 }}>Заказы</h2>
              <span style={{ fontSize: 12, color: "#71717a" }}>{activeOrders.length} активных</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#71717a" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📡</p>
                <p style={{ fontSize: 14 }}>Ожидание заказов...</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Новый заказ появится здесь автоматически</p>
              </div>
            )}

            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.new;
              return (
                <div
                  key={order.id}
                  style={{
                    margin: "4px 8px",
                    borderRadius: 16,
                    border: "1px solid #27272a",
                    backgroundColor: "rgba(24,24,27,0.6)",
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 900 }}>{order.service_name}</p>
                      <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>{order.client_name}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "4px 10px", borderRadius: 20,
                      backgroundColor: `${statusInfo.color}22`,
                      color: statusInfo.color,
                    }}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>
                    <p>📞 {order.client_phone}</p>
                    <p>📍 {order.address}</p>
                    {order.metadata?.description && <p style={{ marginTop: 4, color: "#71717a" }}>{order.metadata.description}</p>}
                  </div>

                  <div style={{ fontSize: 11, color: "#52525b", marginBottom: 8 }}>
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </div>

                  {(order.status === "pending" || order.status === "new") && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "accepted")}
                        style={{
                          flex: 1, borderRadius: 10, padding: "8px 0",
                          backgroundColor: "#10b981", color: "#fff",
                          fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                        }}
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        style={{
                          flex: 1, borderRadius: 10, padding: "8px 0",
                          backgroundColor: "transparent", border: "1px solid #ef4444",
                          color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      style={{
                        width: "100%", borderRadius: 10, padding: "8px 0",
                        backgroundColor: "#10b981", color: "#fff",
                        fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                      }}
                    >
                      Выполнено ✓
                    </button>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function supabaseRemoveChannel(channel: any) {
  try {
    channel?.unsubscribe?.();
  } catch {}
}
